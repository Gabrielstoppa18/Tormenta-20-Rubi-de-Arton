import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { calculateModifier, calculatePV, calculatePM, calculateDefesa, calculateSkill } from '../lib/t20-logic';
import { CLASSES, RACES, ITEMS, T20Power, T20Spell, SKILLS_ATTRIBUTES, powersMap, spellsMap } from '../data/t20-data';
import { characterService } from '../lib/character';
import { compendiumService } from '../lib/compendium';
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
  setName: (name: string) => void;
  setRace: (race: string) => void;
  setClass: (className: string) => void;
  setLevel: (level: number) => void;
  setDeity: (deity: string) => void;
  setGroupId: (groupId: string | undefined) => void;
  setAttribute: (attr: keyof Attributes, value: number) => void;
  setDefenseBonus: (bonus: number) => void;
  toggleCondition: (condition: string) => void;
  takeDamage: (amount: number) => void;
  spendPM: (amount: number) => void;
  addPower: (power: T20Power) => void;
  removePower: (powerName: string) => void;
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

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CharacterState>({
    name: "",
    race: "",
    class: "",
    level: 1,
    deity: "",
    attributes: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
    currentPV: 0,
    currentPM: 0,
    powers: [],
    spells: [],
    trainedSkills: [],
    inventory: [],
    conditions: [],
    defenseBonus: 0,
    isLoaded: false,
    group_id: undefined,
  });

  const modifiers = {
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
  
  const armorPenalty = (equippedArmor ? (ITEMS[equippedArmor.name]?.penalty || 0) : 0) + 
                       (equippedShield ? (ITEMS[equippedShield.name]?.penalty || 0) : 0);

  // Condition Penalties
  const hasCondition = (c: string) => state.conditions.includes(c);
  
  let conditionPenalty = 0;
  if (hasCondition('Fatigado') || hasCondition('Abatido') || hasCondition('Enredado')) {
    conditionPenalty -= 2;
  }
  // Note: Debilitado and Esmorecido are handled at the attribute level in calculateSkillValue

  const classRule = state.class ? (getClassRule(state.class) || CLASSES[state.class]) : null;

  const maxPV = calculatePV(classRule as any, state.level, modifiers.con, hasVitalidade);
  const maxPM = calculatePM(classRule as any, state.level, hasVontadeDeFerro, hasSangueMagico);
  
  // Enredado also gives -2 to DEX (which affects defense)
  const effectiveDex = modifiers.des + (hasCondition('Enredado') ? -2 : 0);
  const defesa = calculateDefesa(effectiveDex, armorBonus, shieldBonus, state.defenseBonus + conditionPenalty);

  const cargaMaxima = 10 + (2 * modifiers.for) + (hasMochileiro ? 5 : 0);
  const cargaAtual = state.inventory.reduce((acc, item) => acc + (item.weight * item.quantity), 0);

  const resistencia = {
    fortitude: calculateSkill(state.level, modifiers.con, state.trainedSkills.includes('Fortitude'), conditionPenalty),
    reflexos: calculateSkill(state.level, modifiers.des, state.trainedSkills.includes('Reflexos'), conditionPenalty),
    vontade: calculateSkill(state.level, modifiers.sab, state.trainedSkills.includes('Vontade'), conditionPenalty),
  };

  const equippedWeapons = state.inventory.filter(i => i.isEquipped && (i.type.includes('Arma') || i.type === 'Escudo'));
  
  const ataques: T20Attack[] = equippedWeapons.map(w => {
    const itemData = ITEMS[w.name];
    const isRanged = w.type.includes('Arremesso') || w.type.includes('Disparo') || w.name.includes('Arco') || w.name.includes('Besta');
    const attrKey = isRanged ? 'des' : 'for';
    let attrValue = modifiers[attrKey];
    
    // Apply attribute-based condition penalties
    if (['for', 'des'].includes(attrKey) && hasCondition('Debilitado')) attrValue -= 2;
    if (attrKey === 'des' && hasCondition('Enredado')) attrValue -= 2;

    const bonus = calculateSkill(state.level, attrValue, state.trainedSkills.includes(isRanged ? 'Pontaria' : 'Luta'), conditionPenalty);
    
    return {
      name: w.name,
      bonus,
      damage: itemData?.damage || '1d4',
      criticalRange: itemData?.criticalRange || 20,
      criticalMultiplier: itemData?.criticalMultiplier || 2,
      type: w.type
    };
  });

  // Add unarmed strike if no weapons equipped or just as a default
  if (ataques.length === 0) {
    let attrValue = modifiers.for;
    if (hasCondition('Debilitado')) attrValue -= 2;
    
    ataques.push({
      name: "Ataque Desarmado",
      bonus: calculateSkill(state.level, attrValue, state.trainedSkills.includes('Luta'), conditionPenalty),
      damage: "1d3",
      criticalRange: 20,
      criticalMultiplier: 2,
      type: "Arma Simples"
    });
  }

  const combate = {
    iniciativa: calculateSkill(state.level, (modifiers.des + (hasCondition('Debilitado') || hasCondition('Enredado') ? -2 : 0)), state.trainedSkills.includes('Iniciativa'), conditionPenalty),
    percepcao: calculateSkill(state.level, (modifiers.sab + (hasCondition('Esmorecido') ? -2 : 0)), state.trainedSkills.includes('Percepção'), conditionPenalty),
    luta: calculateSkill(state.level, (modifiers.for + (hasCondition('Debilitado') ? -2 : 0)), state.trainedSkills.includes('Luta'), conditionPenalty),
    pontaria: calculateSkill(state.level, (modifiers.des + (hasCondition('Debilitado') || hasCondition('Enredado') ? -2 : 0)), state.trainedSkills.includes('Pontaria'), conditionPenalty),
    ataques
  };

  const calculateSkillValue = (skillName: string) => {
    const attrKey = (SKILLS_ATTRIBUTES as any)[skillName] || 'for';
    let attrValue = modifiers[attrKey as keyof Attributes];
    
    // Apply attribute-based condition penalties
    if (['for', 'des', 'con'].includes(attrKey) && hasCondition('Debilitado')) attrValue -= 2;
    if (['int', 'sab', 'car'].includes(attrKey) && hasCondition('Esmorecido')) attrValue -= 2;
    if (attrKey === 'des' && hasCondition('Enredado')) attrValue -= 2;

    const isTrained = state.trainedSkills.includes(skillName);
    const isPenaltyApplicable = ['Acrobacia', 'Furtividade', 'Ladinagem'].includes(skillName);
    return calculateSkill(state.level, attrValue, isTrained, conditionPenalty, armorPenalty, isPenaltyApplicable);
  };

  const setName = (name: string) => setState(s => ({ ...s, name }));
  const setRace = (race: string) => setState(s => ({ ...s, race }));
  const setClass = (className: string) => setState(s => ({ ...s, class: className }));
  const setLevel = (level: number) => setState(s => ({ ...s, level }));
  const setDeity = (deity: string) => setState(s => ({ ...s, deity }));
  const setGroupId = (groupId: string | undefined) => setState(s => ({ ...s, group_id: groupId }));
  const setAttribute = (attr: keyof Attributes, value: number) => 
    setState(s => ({ ...s, attributes: { ...s.attributes, [attr]: value } }));
  const setDefenseBonus = (defenseBonus: number) => setState(s => ({ ...s, defenseBonus }));

  const toggleCondition = (condition: string) => {
    setState(s => ({
      ...s,
      conditions: s.conditions.includes(condition) 
        ? s.conditions.filter(c => c !== condition)
        : [...s.conditions, condition]
    }));
  };

  const takeDamage = (amount: number) => setState(s => ({ ...s, currentPV: s.currentPV - amount }));
  const spendPM = (amount: number) => setState(s => ({ ...s, currentPM: s.currentPM - amount }));
  
  const addPower = (power: T20Power) => setState(s => ({ 
    ...s, 
    powers: [...s.powers, { ...power, id: power.id || crypto.randomUUID() }] 
  }));
  const removePower = (powerId: string) => setState(s => ({ 
    ...s, 
    powers: s.powers.filter(p => (p.id || p.name) !== powerId) 
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
      description: ''
    };
    
    setState(s => ({ ...s, inventory: [...s.inventory, newItem] }));
  };

  const updateItem = (id: string, updates: Partial<T20InventoryItem>) => {
    setState(s => ({
      ...s,
      inventory: s.inventory.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const toggleEquip = (id: string) => {
    setState(s => {
      const item = s.inventory.find(i => i.id === id);
      if (!item) return s;

      const isEquipping = !item.isEquipped;
      let newInventory = [...s.inventory];

      // If equipping armor or shield, unequip others of the same type
      if (isEquipping) {
        if (item.type.includes('Armadura')) {
          newInventory = newInventory.map(i => i.type.includes('Armadura') ? { ...i, isEquipped: false } : i);
        } else if (item.type.includes('Escudo')) {
          newInventory = newInventory.map(i => i.type.includes('Escudo') ? { ...i, isEquipped: false } : i);
        }
      }

      return {
        ...s,
        inventory: newInventory.map(i => i.id === id ? { ...i, isEquipped: isEquipping } : i)
      };
    });
  };

  const removeItem = (id: string) => setState(s => ({ ...s, inventory: s.inventory.filter(i => i.id !== id) }));

  const castSpell = (spellName: string) => {
    const spell = state.spells.find(s => s.name === spellName);
    if (!spell) return;

    if (state.currentPM >= spell.cost) {
      setState(prev => ({
        ...prev,
        currentPM: prev.currentPM - spell.cost
      }));
      console.log(`Conjurou ${spellName} gastando ${spell.cost} PM`);
    } else {
      console.warn("PM insuficiente");
    }
  };

  const rest = () => {
    setState(prev => ({
      ...prev,
      currentPV: maxPV,
      currentPM: maxPM
    }));
  };

  const addTrainedSkill = (skillName: string) => {
    setState(s => ({
      ...s,
      trainedSkills: s.trainedSkills.includes(skillName) ? s.trainedSkills : [...s.trainedSkills, skillName]
    }));
  };

  const removeTrainedSkill = (skillName: string) => {
    setState(s => ({
      ...s,
      trainedSkills: s.trainedSkills.filter(sk => sk !== skillName)
    }));
  };

  const levelUp = () => {
    setState(s => {
      const newLevel = s.level + 1;
      const t20Class = s.class ? (getClassRule(s.class) || (CLASSES as any)[s.class]) : null;
      if (!t20Class) return s;
      
      const mods = {
        con: calculateModifier(s.attributes.con)
      };
      
      const hasVit = s.powers.some(p => p.name === 'Vitalidade' || p.id === 'vitalidade');
      const hasVDF = s.powers.some(p => p.name === 'Vontade de Ferro' || p.id === 'vontade-de-ferro');
      const hasSM = s.powers.some(p => p.name === 'Sangue Mágico' || p.id === 'sangue-magico');

      const pvGain = t20Class.pvPerLevel + mods.con + (hasVit ? 2 : 0);
      const pmGain = t20Class.pmPerLevel + (hasVDF ? 1 : 0) + (hasSM ? 1 : 0);
      
      return {
        ...s,
        level: newLevel,
        currentPV: s.currentPV + pvGain,
        currentPM: s.currentPM + pmGain,
      };
    });
  };

  const levelDown = () => {
    setState(s => {
      if (s.level <= 1) return s;
      const newLevel = s.level - 1;
      const t20Class = s.class ? (getClassRule(s.class) || (CLASSES as any)[s.class]) : null;
      if (!t20Class) return s;

      const mods = {
        con: calculateModifier(s.attributes.con)
      };
      
      const hasVit = s.powers.some(p => p.name === 'Vitalidade' || p.id === 'vitalidade');
      const hasVDF = s.powers.some(p => p.name === 'Vontade de Ferro' || p.id === 'vontade-de-ferro');
      const hasSM = s.powers.some(p => p.name === 'Sangue Mágico' || p.id === 'sangue-magico');

      const pvLoss = t20Class.pvPerLevel + mods.con + (hasVit ? 2 : 0);
      const pmLoss = t20Class.pmPerLevel + (hasVDF ? 1 : 0) + (hasSM ? 1 : 0);

      return {
        ...s,
        level: newLevel,
        currentPV: Math.max(0, s.currentPV - pvLoss),
        currentPM: Math.max(0, s.currentPM - pmLoss),
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
    proficiencies: [] // In future this can be derived from class rule
  });

  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);

  const loadCharacter = useCallback(async (id: string) => {
    try {
      const char = await characterService.getCharacterById(id);
      if (!char) return;

      setCurrentCharacterId(id);
      
      // Fetch associated data (powers, etc.)
      const dbPowers = await characterService.getCharacterPowers(id);
      
      let inventory: T20InventoryItem[] = [];
      let deity = '';
      let spellIds: string[] = [];
      let conditions: string[] = [];
      try {
        if (char.notes && char.notes.startsWith('CHAR_DATA_JSON:')) {
          const charData = JSON.parse(char.notes.replace('CHAR_DATA_JSON:', ''));
          inventory = charData.inventory || [];
          deity = charData.deity || '';
          spellIds = charData.spells || [];
          conditions = charData.conditions || [];
          const trainedSkills = charData.trainedSkills || [];
          
          // Map DB character to context state
          setState({
            name: char.name,
            race: char.race_id || 'human',
            class: char.class_id || 'warrior',
            level: char.level,
            deity: deity,
            attributes: {
              for: char.attributes_base.for || 0,
              des: char.attributes_base.des || 0,
              con: char.attributes_base.con || 0,
              int: char.attributes_base.int || 0,
              sab: char.attributes_base.sab || 0,
              car: char.attributes_base.car || 0,
            },
            currentPV: char.current_hp || 0,
            currentPM: char.current_mp || 0,
            powers: dbPowers.map(dp => {
              const powerDetail = powersMap.get(dp.power_id);
              return {
                id: dp.id,
                name: powerDetail?.name || dp.power?.name || 'Poder Desconhecido',
                description: powerDetail?.description || dp.power?.description || '',
                requirements: powerDetail?.requirements || (dp.power?.requirement_text ? [dp.power.requirement_text] : []),
                type: powerDetail?.type || dp.power?.power_type || 'Geral'
              };
            }),
            spells: spellIds.map(sid => {
              const spellDetail = spellsMap.get(sid);
              if (spellDetail) {
                return { ...spellDetail };
              }
              return null;
            }).filter(s => s !== null) as T20Spell[],
            trainedSkills: trainedSkills,
            inventory: inventory.length > 0 ? inventory : [
              { id: '1', name: "Espada Longa", type: "Arma Marcial", weight: 1.5, cost: "15 T$", quantity: 1 },
              { id: '2', name: "Armadura de Couro", type: "Armadura Leve", weight: 7, cost: "10 T$", quantity: 1 }
            ],
            conditions,
            defenseBonus: 0,
            isLoaded: true,
            group_id: char.group_id
          });
          return;
        }
      } catch (e) {
        console.error('Error parsing character data from notes:', e);
      }

      // Fallback if no notes JSON
      setState({
        name: char.name,
        race: char.race_id || 'human',
        class: char.class_id || 'warrior',
        level: char.level,
        deity: deity,
        attributes: {
          for: char.attributes_base.for || 0,
          des: char.attributes_base.des || 0,
          con: char.attributes_base.con || 0,
          int: char.attributes_base.int || 0,
          sab: char.attributes_base.sab || 0,
          car: char.attributes_base.car || 0,
        },
        currentPV: char.current_hp || 0,
        currentPM: char.current_mp || 0,
        powers: dbPowers.map(dp => {
          const powerDetail = powersMap.get(dp.power_id);
          return {
            id: dp.id,
            name: powerDetail?.name || dp.power?.name || 'Poder Desconhecido',
            description: powerDetail?.description || dp.power?.description || '',
            requirements: powerDetail?.requirements || (dp.power?.requirement_text ? [dp.power.requirement_text] : []),
            type: powerDetail?.type || dp.power?.power_type || 'Geral'
          };
        }),
        spells: [],
        trainedSkills: [],
        inventory: [
          { id: '1', name: "Espada Longa", type: "Arma Marcial", weight: 1.5, cost: "15 T$", quantity: 1 },
          { id: '2', name: "Armadura de Couro", type: "Armadura Leve", weight: 7, cost: "10 T$", quantity: 1 }
        ],
        defenseBonus: 0,
        isLoaded: true,
        group_id: char.group_id
      });
    } catch (error) {
      console.error('Error loading character into context:', error);
    }
  }, []);

  const unloadCharacter = useCallback(() => {
    setCurrentCharacterId(null);
    setState({
      name: "",
      race: "",
      class: "",
      level: 1,
      deity: "",
      attributes: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
      currentPV: 0,
      currentPM: 0,
      powers: [],
      spells: [],
      inventory: [],
      conditions: [],
      defenseBonus: 0,
      isLoaded: false,
      group_id: undefined,
    });
  }, []);

  const saveCharacter = async () => {
    if (!currentCharacterId) return;
    try {
      const charDataJson = `CHAR_DATA_JSON:${JSON.stringify({
        inventory: state.inventory,
        deity: state.deity,
        spells: state.spells.map(s => s.name.toLowerCase().replace(/\s+/g, '_')),
        trainedSkills: state.trainedSkills,
        conditions: state.conditions
      })}`;
      await characterService.updateCharacter(currentCharacterId, {
        name: state.name,
        race_id: state.race,
        class_id: state.class,
        level: state.level,
        attributes_base: state.attributes,
        current_hp: state.currentPV,
        current_mp: state.currentPM,
        group_id: state.group_id,
        notes: charDataJson,
      });
      console.log('Character saved successfully');
    } catch (error) {
      console.error('Error saving character:', error);
    }
  };

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
      setName,
      setRace,
      setClass,
      setLevel,
      setDeity,
      setGroupId,
      setAttribute,
      setDefenseBonus,
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
