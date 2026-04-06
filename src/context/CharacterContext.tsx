import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { calculateModifier, calculatePV, calculatePM, calculateDefesa } from '../lib/t20-logic';
import { CLASSES, RACES, ITEMS, T20Power, T20Spell } from '../data/t20-data';
import { characterService } from '../lib/character';
import { compendiumService } from '../lib/compendium';
import type { Character } from '../types/database';

interface Attributes {
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
  inventory: T20InventoryItem[];
  defenseBonus: number;
  isLoaded: boolean;
}

interface CharacterContextType {
  state: CharacterState;
  modifiers: Attributes;
  maxPV: number;
  maxPM: number;
  defesa: number;
  setName: (name: string) => void;
  setRace: (race: string) => void;
  setClass: (className: string) => void;
  setLevel: (level: number) => void;
  setDeity: (deity: string) => void;
  setAttribute: (attr: keyof Attributes, value: number) => void;
  setDefenseBonus: (bonus: number) => void;
  takeDamage: (amount: number) => void;
  spendPM: (amount: number) => void;
  addPower: (power: T20Power) => void;
  removePower: (powerName: string) => void;
  addSpell: (spell: T20Spell) => void;
  removeSpell: (spellName: string) => void;
  addItem: (itemName: string) => void;
  updateItem: (id: string, updates: Partial<T20InventoryItem>) => void;
  removeItem: (id: string) => void;
  levelUp: () => void;
  levelDown: () => void;
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
    inventory: [],
    defenseBonus: 0,
    isLoaded: false,
  });

  const modifiers = {
    for: calculateModifier(state.attributes.for),
    des: calculateModifier(state.attributes.des),
    con: calculateModifier(state.attributes.con),
    int: calculateModifier(state.attributes.int),
    sab: calculateModifier(state.attributes.sab),
    car: calculateModifier(state.attributes.car),
  };

  const maxPV = calculatePV(state.class, state.level, modifiers.con);
  const maxPM = calculatePM(state.class, state.level);
  const defesa = calculateDefesa(modifiers.des, 0, 0, state.defenseBonus);

  const setName = (name: string) => setState(s => ({ ...s, name }));
  const setRace = (race: string) => setState(s => ({ ...s, race }));
  const setClass = (className: string) => setState(s => ({ ...s, class: className }));
  const setLevel = (level: number) => setState(s => ({ ...s, level }));
  const setDeity = (deity: string) => setState(s => ({ ...s, deity }));
  const setAttribute = (attr: keyof Attributes, value: number) => 
    setState(s => ({ ...s, attributes: { ...s.attributes, [attr]: value } }));
  const setDefenseBonus = (defenseBonus: number) => setState(s => ({ ...s, defenseBonus }));

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

  const removeItem = (id: string) => setState(s => ({ ...s, inventory: s.inventory.filter(i => i.id !== id) }));

  const levelUp = () => {
    setState(s => {
      const newLevel = s.level + 1;
      const t20Class = CLASSES[s.class];
      if (!t20Class) return s;
      
      // Base gains
      let pvGain = t20Class.pvPerLevel + calculateModifier(s.attributes.con);
      let pmGain = t20Class.pmPerLevel;
      
      // Power bonuses
      if (s.powers.some(p => p.name === 'Vitalidade')) {
        pvGain += 2;
      }
      if (s.powers.some(p => p.name === 'Vontade de Ferro')) {
        pmGain += 1;
      }
      
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
      const t20Class = CLASSES[s.class];
      if (!t20Class) return s;
      const pvLoss = t20Class.pvPerLevel + calculateModifier(s.attributes.con);
      const pmLoss = t20Class.pmPerLevel;
      return {
        ...s,
        level: newLevel,
        currentPV: Math.max(0, s.currentPV - pvLoss),
        currentPM: Math.max(0, s.currentPM - pmLoss),
      };
    });
  };

  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);

  const loadCharacter = useCallback(async (id: string) => {
    try {
      const char = await characterService.getCharacterById(id);
      if (!char) return;

      setCurrentCharacterId(id);
      
      // Fetch associated data (powers, etc.)
      const dbPowers = await characterService.getCharacterPowers(id);
      
      let inventory: T20InventoryItem[] = [];
      let deity = 'Khalmyr';
      try {
        if (char.notes && char.notes.startsWith('CHAR_DATA_JSON:')) {
          const charData = JSON.parse(char.notes.replace('CHAR_DATA_JSON:', ''));
          inventory = charData.inventory || [];
          deity = charData.deity || 'Khalmyr';
        }
      } catch (e) {
        console.error('Error parsing character data from notes:', e);
      }

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
        powers: dbPowers.map(dp => ({
          id: dp.id,
          name: dp.power?.name || 'Poder Desconhecido',
          description: dp.power?.description || '',
          requirements: dp.power?.requirement_text ? [dp.power.requirement_text] : []
        })),
        spells: [], // TODO: Fetch spells
        inventory: inventory.length > 0 ? inventory : [
          { id: '1', name: "Espada Longa", type: "Arma Marcial", weight: 1.5, cost: "15 T$", quantity: 1 },
          { id: '2', name: "Armadura de Couro", type: "Armadura Leve", weight: 7, cost: "10 T$", quantity: 1 }
        ],
        defenseBonus: 0,
        isLoaded: true,
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
      defenseBonus: 0,
      isLoaded: false,
    });
  }, []);

  const saveCharacter = async () => {
    if (!currentCharacterId) return;
    try {
      const charDataJson = `CHAR_DATA_JSON:${JSON.stringify({
        inventory: state.inventory,
        deity: state.deity
      })}`;
      await characterService.updateCharacter(currentCharacterId, {
        name: state.name,
        race_id: state.race,
        class_id: state.class,
        level: state.level,
        attributes_base: state.attributes,
        current_hp: state.currentPV,
        current_mp: state.currentPM,
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
      setName,
      setRace,
      setClass,
      setLevel,
      setDeity,
      setAttribute,
      setDefenseBonus,
      takeDamage,
      spendPM,
      addPower,
      removePower,
      addSpell,
      removeSpell,
      addItem,
      updateItem,
      removeItem,
      levelUp,
      levelDown,
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
