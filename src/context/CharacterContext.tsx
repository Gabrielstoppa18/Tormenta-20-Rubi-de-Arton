import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { calculateModifier, calculatePV, calculatePM, calculateDefesa, calculateSkill } from '../lib/t20-logic';
import { CLASSES, RACES, ITEMS, T20Power, T20Spell, SKILLS_ATTRIBUTES } from '../data/t20-data';
import { characterService } from '../lib/character';
import { getClassRule } from '../lib/rules/classes';
import { ValidatableCharacter } from '../lib/rules/types';
import type { Character } from '../types/database';

export interface Attributes {
  for: number;
  des: number;
  con: number;
  int: number;
  sab: number;
  car: number;
}

export interface T20InventoryItem {
  id: string;
  name: string;
  type: string;
  weight: number;
  cost: string;
  quantity: number;
  isEquipped?: boolean;
  description?: string;
}

interface CharacterState {
  name: string;
  race: string;
  class: string;
  level: number;
  deity: string;
  attributes: Attributes;
  currentPV: number;
  currentPM: number;
  tibar: number;
  powers: T20Power[];
  spells: T20Spell[];
  trainedSkills: string[];
  inventory: T20InventoryItem[];
  conditions: string[];
  defenseBonus: number;
  isLoaded: boolean;
  group_id?: string;
}

export interface T20Attack {
  name: string;
  bonus: number;
  damage: string;
  criticalRange: number;
  criticalMultiplier: number;
  type: string;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Skills that receive armor check penalty in T20
const ARMOR_PENALTY_SKILLS = new Set([
  'Acrobacia',
  'Atletismo',
  'Furtividade',
  'Ladinagem',
]);

interface CharacterContextType {
  state: CharacterState;
  modifiers: Attributes;
  maxPV: number;
  maxPM: number;
  defesa: number;
  cargaMaxima: number;
  cargaAtual: number;
  armorPenalty: number;
  resistencia: {
    fortitude: number;
    reflexos: number;
    vontade: number;
  };
  combate: {
    iniciativa: number;
    percepcao: number;
    luta: number;
    pontaria: number;
    ataques: T20Attack[];
  };
  currentCharacterId: string | null;
  saveStatus: SaveStatus;
  setName: (name: string) => void;
  setRace: (race: string) => void;
  setClass: (className: string) => void;
  setLevel: (level: number) => void;
  setDeity: (deity: string) => void;
  setGroupId: (groupId: string | undefined) => void;
  setAttribute: (attr: keyof Attributes, value: number) => void;
  setDefenseBonus: (bonus: number) => void;
  setTibar: (amount: number) => void;
  toggleCondition: (condition: string) => void;
  takeDamage: (amount: number) => void;
  spendPM: (amount: number) => void;
  addPower: (power: T20Power) => void;
  removePower: (powerIdOrName: string) => void;
  addSpell: (spell: T20Spell) => void;
  removeSpell: (spellName: string) => void;
  addTrainedSkill: (skillName: string) => void;
  removeTrainedSkill: (skillName: string) => void;
  addItem: (itemName: string) => void;
  updateItem: (id: string, updates: Partial<T20InventoryItem>) => void;
  toggleEquip: (id: string) => void;
  removeItem: (id: string) => void;
  castSpell: (spellName: string) => void;
  rest: () => void;
  calculateSkillValue: (skillName: string) => number;
  levelUp: () => void;
  levelDown: () => void;
  getValidatableCharacter: () => ValidatableCharacter;
  loadCharacter: (id: string) => Promise<void>;
  saveCharacter: () => Promise<void>;
  unloadCharacter: () => void;
}

const EMPTY_STATE: CharacterState = {
  name: '',
  race: '',
  class: '',
  level: 1,
  deity: '',
  attributes: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
  currentPV: 0,
  currentPM: 0,
  tibar: 0,
  powers: [],
  spells: [],
  trainedSkills: [],
  inventory: [],
  conditions: [],
  defenseBonus: 0,
  isLoaded: false,
  group_id: undefined,
};

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CharacterState>(EMPTY_STATE);
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Auto-save debounce refs
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const isLoadingRef = useRef(false);

  const modifiers: Attributes = {
    for: calculateModifier(state.attributes.for),
    des: calculateModifier(state.attributes.des),
    con: calculateModifier(state.attributes.con),
    int: calculateModifier(state.attributes.int),
    sab: calculateModifier(state.attributes.sab),
    car: calculateModifier(state.attributes.car),
  };

  const hasVitalidade = state.powers.some(p => p.name === 'Vitalidade');
  const hasVontadeDeFerro = state.powers.some(p => p.name === 'Vontade de Ferro');
  const hasSangueMagico = state.powers.some(p => p.name === 'Sangue Mágico');
  const hasMochileiro = state.powers.some(p => p.name === 'Mochileiro');

  const equippedArmor = state.inventory.find(i => i.isEquipped && i.type.includes('Armadura'));
  const equippedShield = state.inventory.find(i => i.isEquipped && i.type.includes('Escudo'));

  const armorBonus = equippedArmor ? (ITEMS[equippedArmor.name]?.defenseBonus || 0) : 0;
  const shieldBonus = equippedShield ? (ITEMS[equippedShield.name]?.defenseBonus || 0) : 0;
  const armorPenalty = (equippedArmor ? (ITEMS[equippedArmor.name]?.penalty || 0) : 0)
                     + (equippedShield ? (ITEMS[equippedShield.name]?.penalty || 0) : 0);

  const hasCondition = (c: string) => state.conditions.includes(c);

  // Fatigado e Abatido: -2 em todos os testes
  // Enredado: -2 apenas em testes de DES (tratado individualmente)
  let conditionPenalty = 0;
  if (hasCondition('Fatigado') || hasCondition('Abatido')) {
    conditionPenalty -= 2;
  }

  const classRule = state.class ? (getClassRule(state.class) || CLASSES[state.class]) : null;

  const maxPV = calculatePV(classRule as any, state.level, modifiers.con, hasVitalidade);
  const maxPM = calculatePM(classRule as any, state.level, hasVontadeDeFerro, hasSangueMagico);

  const effectiveDex = modifiers.des + (hasCondition('Enredado') ? -2 : 0);
  const defesa = calculateDefesa(effectiveDex, armorBonus, shieldBonus, state.defenseBonus + conditionPenalty);

  const cargaMaxima = 10 + (2 * modifiers.for) + (hasMochileiro ? 5 : 0);
  const cargaAtual = state.inventory.reduce((acc, item) => acc + (item.weight * item.quantity), 0);

  const resistencia = {
    fortitude: calculateSkill(state.level, modifiers.con, state.trainedSkills.includes('Fortitude'), conditionPenalty),
    reflexos: calculateSkill(state.level, modifiers.des + (hasCondition('Enredado') ? -2 : 0), state.trainedSkills.includes('Reflexos'), conditionPenalty),
    vontade: calculateSkill(state.level, modifiers.sab, state.trainedSkills.includes('Vontade'), conditionPenalty),
  };

  // "Arma Simples" / "Arma Marcial" — NÃO "Armadura Leve/Pesada"
  const equippedWeapons = state.inventory.filter(i => i.isEquipped && i.type.startsWith('Arma '));

  const ataques: T20Attack[] = equippedWeapons.map(w => {
    const itemData = ITEMS[w.name];
    const isRanged = w.type.includes('Arremesso') || w.type.includes('Disparo') || w.name.includes('Arco') || w.name.includes('Besta');
    const attrKey = isRanged ? 'des' : 'for';
    let attrValue = modifiers[attrKey];

    if (['for', 'des'].includes(attrKey) && hasCondition('Debilitado')) attrValue -= 2;
    if (attrKey === 'des' && hasCondition('Enredado')) attrValue -= 2;

    const isTrained = state.trainedSkills.includes(isRanged ? 'Pontaria' : 'Luta');
    const bonus = calculateSkill(state.level, attrValue, isTrained, conditionPenalty);

    return {
      name: w.name,
      bonus,
      damage: itemData?.damage || '1d4',
      criticalRange: itemData?.criticalRange || 20,
      criticalMultiplier: itemData?.criticalMultiplier || 2,
      type: w.type,
    };
  });

  if (ataques.length === 0) {
    let attrValue = modifiers.for;
    if (hasCondition('Debilitado')) attrValue -= 2;
    ataques.push({
      name: 'Ataque Desarmado',
      bonus: calculateSkill(state.level, attrValue, state.trainedSkills.includes('Luta'), conditionPenalty),
      damage: '1d3',
      criticalRange: 20,
      criticalMultiplier: 2,
      type: 'Arma Simples',
    });
  }

  const desDebil = (hasCondition('Debilitado') || hasCondition('Enredado')) ? -2 : 0;
  const combate = {
    iniciativa: calculateSkill(state.level, modifiers.des + desDebil, state.trainedSkills.includes('Iniciativa'), conditionPenalty),
    percepcao: calculateSkill(state.level, modifiers.sab + (hasCondition('Esmorecido') ? -2 : 0), state.trainedSkills.includes('Percepção'), conditionPenalty),
    luta: calculateSkill(state.level, modifiers.for + (hasCondition('Debilitado') ? -2 : 0), state.trainedSkills.includes('Luta'), conditionPenalty),
    pontaria: calculateSkill(state.level, modifiers.des + desDebil, state.trainedSkills.includes('Pontaria'), conditionPenalty),
    ataques,
  };

  const calculateSkillValue = (skillName: string): number => {
    const attrKey = (SKILLS_ATTRIBUTES as any)[skillName] || 'for';
    let attrValue = modifiers[attrKey as keyof Attributes];

    if (['for', 'des', 'con'].includes(attrKey) && hasCondition('Debilitado')) attrValue -= 2;
    if (['int', 'sab', 'car'].includes(attrKey) && hasCondition('Esmorecido')) attrValue -= 2;
    if (attrKey === 'des' && hasCondition('Enredado')) attrValue -= 2;

    const isTrained = state.trainedSkills.includes(skillName);
    const isPenaltyApplicable = ARMOR_PENALTY_SKILLS.has(skillName);
    return calculateSkill(state.level, attrValue, isTrained, conditionPenalty, armorPenalty, isPenaltyApplicable);
  };

  // --- Setters ---

  const setName = (name: string) => setState(s => ({ ...s, name }));
  const setRace = (race: string) => setState(s => ({ ...s, race }));
  const setClass = (className: string) => setState(s => ({ ...s, class: className }));
  const setLevel = (level: number) => setState(s => ({ ...s, level }));
  const setDeity = (deity: string) => setState(s => ({ ...s, deity }));
  const setGroupId = (groupId: string | undefined) => setState(s => ({ ...s, group_id: groupId }));
  const setAttribute = (attr: keyof Attributes, value: number) =>
    setState(s => ({ ...s, attributes: { ...s.attributes, [attr]: value } }));
  const setDefenseBonus = (defenseBonus: number) => setState(s => ({ ...s, defenseBonus }));
  const setTibar = (tibar: number) => setState(s => ({ ...s, tibar: Math.max(0, tibar) }));

  const toggleCondition = (condition: string) => {
    setState(s => ({
      ...s,
      conditions: s.conditions.includes(condition)
        ? s.conditions.filter(c => c !== condition)
        : [...s.conditions, condition],
    }));
  };

  const takeDamage = (amount: number) => setState(s => ({ ...s, currentPV: s.currentPV - amount }));
  const spendPM = (amount: number) => setState(s => ({ ...s, currentPM: s.currentPM - amount }));

  const addPower = (power: T20Power) => setState(s => ({
    ...s,
    powers: [...s.powers, { ...power, id: power.id || crypto.randomUUID() }],
  }));

  const removePower = (powerIdOrName: string) => setState(s => ({
    ...s,
    powers: s.powers.filter(p => (p.id || p.name) !== powerIdOrName),
  }));

  const addSpell = (spell: T20Spell) => setState(s => ({ ...s, spells: [...s.spells, spell] }));
  const removeSpell = (spellName: string) => setState(s => ({ ...s, spells: s.spells.filter(sp => sp.name !== spellName) }));

  const addItem = (itemName: string) => {
    const baseItem = ITEMS[itemName];
    if (!baseItem) return;
    const newItem: T20InventoryItem = {
      id: crypto.randomUUID(),
      name: baseItem.name,
      type: baseItem.type,
      weight: baseItem.weight,
      cost: baseItem.cost,
      quantity: 1,
      description: '',
    };
    setState(s => ({ ...s, inventory: [...s.inventory, newItem] }));
  };

  const updateItem = (id: string, updates: Partial<T20InventoryItem>) => {
    setState(s => ({
      ...s,
      inventory: s.inventory.map(item => item.id === id ? { ...item, ...updates } : item),
    }));
  };

  const toggleEquip = (id: string) => {
    setState(s => {
      const item = s.inventory.find(i => i.id === id);
      if (!item) return s;
      const isEquipping = !item.isEquipped;
      let newInventory = [...s.inventory];
      if (isEquipping) {
        if (item.type.includes('Armadura')) {
          newInventory = newInventory.map(i => i.type.includes('Armadura') ? { ...i, isEquipped: false } : i);
        } else if (item.type.includes('Escudo')) {
          newInventory = newInventory.map(i => i.type.includes('Escudo') ? { ...i, isEquipped: false } : i);
        }
      }
      return { ...s, inventory: newInventory.map(i => i.id === id ? { ...i, isEquipped: isEquipping } : i) };
    });
  };

  const removeItem = (id: string) => setState(s => ({ ...s, inventory: s.inventory.filter(i => i.id !== id) }));

  const castSpell = (spellName: string) => {
    setState(prev => {
      const spell = prev.spells.find(s => s.name === spellName);
      if (!spell || prev.currentPM < spell.cost) return prev;
      return { ...prev, currentPM: prev.currentPM - spell.cost };
    });
  };

  const rest = () => setState(prev => ({ ...prev, currentPV: maxPV, currentPM: maxPM }));

  const addTrainedSkill = (skillName: string) => {
    setState(s => ({
      ...s,
      trainedSkills: s.trainedSkills.includes(skillName) ? s.trainedSkills : [...s.trainedSkills, skillName],
    }));
  };

  const removeTrainedSkill = (skillName: string) => {
    setState(s => ({ ...s, trainedSkills: s.trainedSkills.filter(sk => sk !== skillName) }));
  };

  const levelUp = () => {
    setState(s => {
      const newLevel = s.level + 1;
      const t20Class = s.class ? (getClassRule(s.class) || (CLASSES as any)[s.class]) : null;
      if (!t20Class) return s;

      const conMod = calculateModifier(s.attributes.con);
      const hasVit = s.powers.some(p => p.name === 'Vitalidade');
      const hasVDF = s.powers.some(p => p.name === 'Vontade de Ferro');
      const hasSM = s.powers.some(p => p.name === 'Sangue Mágico');

      return {
        ...s,
        level: newLevel,
        currentPV: s.currentPV + t20Class.pvPerLevel + conMod + (hasVit ? 2 : 0),
        currentPM: s.currentPM + t20Class.pmPerLevel + (hasVDF ? 1 : 0) + (hasSM ? 1 : 0),
      };
    });
  };

  const levelDown = () => {
    setState(s => {
      if (s.level <= 1) return s;
      const t20Class = s.class ? (getClassRule(s.class) || (CLASSES as any)[s.class]) : null;
      if (!t20Class) return s;

      const conMod = calculateModifier(s.attributes.con);
      const hasVit = s.powers.some(p => p.name === 'Vitalidade');
      const hasVDF = s.powers.some(p => p.name === 'Vontade de Ferro');
      const hasSM = s.powers.some(p => p.name === 'Sangue Mágico');

      return {
        ...s,
        level: s.level - 1,
        currentPV: Math.max(0, s.currentPV - (t20Class.pvPerLevel + conMod + (hasVit ? 2 : 0))),
        currentPM: Math.max(0, s.currentPM - (t20Class.pmPerLevel + (hasVDF ? 1 : 0) + (hasSM ? 1 : 0))),
      };
    });
  };

  const getValidatableCharacter = (): ValidatableCharacter => ({
    level: state.level,
    class_id: state.class,
    race_id: state.race,
    deity: state.deity,
    attributes: state.attributes,
    powers: state.powers.map(p => p.id || p.name),
    trainedSkills: state.trainedSkills,
    proficiencies: [],
  });

  // --- Persistence ---

  const saveCharacter = useCallback(async () => {
    if (!currentCharacterId) return;
    setSaveStatus('saving');
    try {
      await characterService.updateCharacter(currentCharacterId, {
        name: state.name,
        race_id: state.race,
        class_id: state.class,
        level: state.level,
        attributes_base: state.attributes,
        current_hp: state.currentPV,
        current_mp: state.currentPM,
        group_id: state.group_id,
        deity: state.deity,
        trained_skills: state.trainedSkills,
        conditions: state.conditions,
        defense_bonus: state.defenseBonus,
        powers_data: state.powers as any,
        spells_data: state.spells as any,
        inventory_data: state.inventory as any,
        notes: `tibar:${state.tibar}`,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error) {
      console.error('Error saving character:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [state, currentCharacterId]);

  // Auto-save: 3s debounce after any meaningful state change
  useEffect(() => {
    if (!state.isLoaded || !currentCharacterId || isLoadingRef.current) return;

    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveCharacter();
    }, 3000);

    return () => clearTimeout(autoSaveTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.name, state.race, state.class, state.level, state.deity,
    state.attributes, state.currentPV, state.currentPM, state.tibar,
    state.powers, state.spells, state.trainedSkills, state.inventory,
    state.conditions, state.defenseBonus, state.group_id,
  ]);

  const loadCharacter = useCallback(async (id: string) => {
    try {
      isLoadingRef.current = true;
      const char = await characterService.getCharacterById(id);
      if (!char) return;

      setCurrentCharacterId(id);

      let powers: T20Power[] = (char.powers_data as T20Power[] | undefined) || [];
      let spells: T20Spell[] = (char.spells_data as T20Spell[] | undefined) || [];
      let inventory: T20InventoryItem[] = (char.inventory_data as T20InventoryItem[] | undefined) || [];
      let deity = char.deity || '';
      let trainedSkills = char.trained_skills || [];
      let conditions = char.conditions || [];
      let defenseBonus = char.defense_bonus || 0;
      let tibar = 0;

      // Extract tibar from notes if stored
      if (char.notes?.startsWith('tibar:')) {
        tibar = parseInt(char.notes.replace('tibar:', '')) || 0;
      }

      // Legacy fallback
      if (powers.length === 0 && spells.length === 0 && inventory.length === 0) {
        const dbPowers = await characterService.getCharacterPowers(id);
        if (dbPowers.length > 0) {
          powers = dbPowers.map(dp => ({
            id: dp.id,
            name: dp.power?.name || dp.power_id,
            description: dp.power?.description || '',
            requirements: dp.power?.requirement_text ? [dp.power.requirement_text] : [],
            type: dp.power?.power_type || 'Geral',
          }));
        }

        if (char.notes?.startsWith('CHAR_DATA_JSON:')) {
          try {
            const legacy = JSON.parse(char.notes.replace('CHAR_DATA_JSON:', ''));
            inventory = legacy.inventory || [];
            deity = legacy.deity || '';
            trainedSkills = legacy.trainedSkills || [];
            conditions = legacy.conditions || [];
          } catch {
            // Ignore
          }
        }
      }

      setState({
        name: char.name,
        race: char.race_id || '',
        class: char.class_id || '',
        level: char.level,
        deity,
        attributes: {
          for: char.attributes_base?.for || 0,
          des: char.attributes_base?.des || 0,
          con: char.attributes_base?.con || 0,
          int: char.attributes_base?.int || 0,
          sab: char.attributes_base?.sab || 0,
          car: char.attributes_base?.car || 0,
        },
        currentPV: char.current_hp || 0,
        currentPM: char.current_mp || 0,
        tibar,
        powers,
        spells,
        trainedSkills,
        inventory,
        conditions,
        defenseBonus,
        isLoaded: true,
        group_id: char.group_id,
      });
    } catch (error) {
      console.error('Error loading character:', error);
    } finally {
      // Brief delay so the auto-save effect doesn't fire on load
      setTimeout(() => { isLoadingRef.current = false; }, 500);
    }
  }, []);

  const unloadCharacter = useCallback(() => {
    clearTimeout(autoSaveTimer.current);
    setCurrentCharacterId(null);
    setSaveStatus('idle');
    setState(EMPTY_STATE);
  }, []);

  return (
    <CharacterContext.Provider value={{
      state,
      modifiers,
      maxPV,
      maxPM,
      defesa,
      cargaMaxima,
      cargaAtual,
      armorPenalty,
      resistencia,
      combate,
      currentCharacterId,
      saveStatus,
      setName,
      setRace,
      setClass,
      setLevel,
      setDeity,
      setGroupId,
      setAttribute,
      setDefenseBonus,
      setTibar,
      toggleCondition,
      takeDamage,
      spendPM,
      addPower,
      removePower,
      addSpell,
      removeSpell,
      addItem,
      updateItem,
      toggleEquip,
      removeItem,
      castSpell,
      rest,
      calculateSkillValue,
      addTrainedSkill,
      removeTrainedSkill,
      levelUp,
      levelDown,
      getValidatableCharacter,
      loadCharacter,
      saveCharacter,
      unloadCharacter,
    }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}
