import { useState, useMemo } from 'react';

/**
 * Custom Hook for Tormenta 20 Character Logic
 * @param characterData The JSON data from Hera.json
 */
export function useT20Character(characterData: any) {
  // 1. Manage Status State
  // Initializing with values from the JSON
  const [pv, setPv] = useState(characterData.system.attributes.pv.value);
  const [pm, setPm] = useState(characterData.system.attributes.pm.value);

  // 2. Calculate Modifiers
  // Formula: floor((attribute - 10) / 2)
  // Note: In some T20 JSON exports, "base" might already be the modifier.
  // We strictly follow the requested formula here.
  const calculateMod = (val: number) => Math.floor((val - 10) / 2);

  const modifiers = useMemo(() => {
    const mods: Record<string, number> = {};
    const atributos = characterData.system.atributos;
    
    Object.keys(atributos).forEach((key) => {
      mods[key] = calculateMod(atributos[key].base);
    });
    
    return mods;
  }, [characterData]);

  // 3. Calculate Skills (Perícias)
  // Total = (Half Level + Attribute Mod + Training Bonus)
  const level = characterData.system.attributes.nivel.value || 1;
  const halfLevel = Math.floor(level / 2);
  
  // Training scale: 1-6: +2, 7-14: +4, 15-20: +6
  const trainingBonusValue = level <= 6 ? 2 : (level <= 14 ? 4 : 6);

  const skills = useMemo(() => {
    const calculated: Record<string, number> = {};
    const pericias = characterData.system.pericias;

    Object.keys(pericias).forEach((key) => {
      const skill = pericias[key];
      const attrMod = modifiers[skill.atributo] || 0;
      const trainingBonus = skill.treinado ? trainingBonusValue : 0;
      
      calculated[key] = halfLevel + attrMod + trainingBonus + (skill.outros || 0);
    });

    return calculated;
  }, [modifiers, halfLevel, trainingBonusValue, characterData]);

  // 4. Status Management Functions
  const takeDamage = (amount: number) => {
    setPv((prev: number) => prev - amount);
  };

  const spendPM = (amount: number) => {
    setPm((prev: number) => prev - amount);
  };

  // 5. Map Equipment (Weapons)
  // Attack Bonus = (Luta/Pontaria + Modificador + Weapon Bonus)
  const weapons = useMemo(() => {
    return (characterData.items || [])
      .filter((item: any) => item.type === 'arma')
      .map((weapon: any) => {
        // Determine if it uses Luta (Melee) or Pontaria (Ranged)
        // Defaulting to 'luta' if not specified
        const isRanged = weapon.system?.range && weapon.system.range !== 'melee';
        const skillKey = isRanged ? 'pont' : 'luta';
        
        const skillValue = skills[skillKey] || 0;
        const attrMod = modifiers[weapon.system?.atributo || 'for'] || 0;
        const weaponBonus = weapon.system?.bonus || 0;

        return {
          name: weapon.name,
          attackBonus: skillValue + attrMod + weaponBonus,
          damage: weapon.system?.damage || '1d6',
          type: weapon.system?.tipo || 'Melee'
        };
      });
  }, [characterData, skills, modifiers]);

  return {
    // State
    pv,
    pm,
    // Calculated Data
    modifiers,
    skills,
    weapons,
    // Actions
    takeDamage,
    spendPM,
    // Metadata
    name: characterData.name,
    level,
    race: characterData.system.detalhes.raca,
    class: characterData.items.find((i: any) => i.type === 'classe')?.name || 'N/A'
  };
}
