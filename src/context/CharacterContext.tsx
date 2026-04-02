import React, { createContext, useContext, useState, ReactNode } from 'react';
import { calculateModifier, calculatePV, calculatePM, calculateDefesa } from '../lib/t20-logic';
import { CLASSES, RACES, T20Power, T20Spell } from '../data/t20-data';

interface Attributes {
  for: number;
  des: number;
  con: number;
  int: number;
  sab: number;
  car: number;
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
  inventory: string[];
  defenseBonus: number;
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
  removeItem: (itemName: string) => void;
  levelUp: () => void;
  levelDown: () => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CharacterState>({
    name: "Sir Alistair",
    race: "Humano",
    class: "Paladino",
    level: 1,
    deity: "Khalmyr",
    attributes: { for: 4, des: 2, con: 2, int: 1, sab: 1, car: 3 },
    currentPV: 22,
    currentPM: 3,
    powers: [],
    spells: [],
    inventory: ["Espada Longa", "Armadura de Couro"],
    defenseBonus: 0,
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
  
  const addPower = (power: T20Power) => setState(s => ({ ...s, powers: [...s.powers, power] }));
  const removePower = (powerName: string) => setState(s => ({ ...s, powers: s.powers.filter(p => p.name !== powerName) }));
  const addSpell = (spell: T20Spell) => setState(s => ({ ...s, spells: [...s.spells, spell] }));
  const removeSpell = (spellName: string) => setState(s => ({ ...s, spells: s.spells.filter(sp => sp.name !== spellName) }));
  
  const addItem = (itemName: string) => setState(s => ({ ...s, inventory: [...s.inventory, itemName] }));
  const removeItem = (itemName: string) => setState(s => ({ ...s, inventory: s.inventory.filter(i => i !== itemName) }));

  const levelUp = () => {
    setState(s => {
      const newLevel = s.level + 1;
      const t20Class = CLASSES[s.class];
      if (!t20Class) return s;
      const pvGain = t20Class.pvPerLevel + calculateModifier(s.attributes.con);
      const pmGain = t20Class.pmPerLevel;
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
      removeItem,
      levelUp,
      levelDown,
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
