import { CLASSES, RACES } from '../data/t20-data';

export function calculateModifier(value: number): number {
  // In T20 Jogo do Ano, the attribute value IS the modifier.
  return value;
}

export function calculatePV(
  className: string,
  level: number,
  con: number
): number {
  const t20Class = CLASSES[className];
  if (!t20Class) return 0;
  
  // Initial PV = Base + CON
  // Per level = Gain + CON
  // Total = Base + CON + (Level - 1) * (Gain + CON)
  return t20Class.initialPV + con + (level - 1) * (t20Class.pvPerLevel + con);
}

export function calculatePM(
  className: string,
  level: number
): number {
  const t20Class = CLASSES[className];
  if (!t20Class) return 0;
  
  return t20Class.initialPM + (level - 1) * t20Class.pmPerLevel;
}

export function calculateDefesa(
  dex: number,
  armorBonus: number = 0,
  shieldBonus: number = 0,
  otherBonus: number = 0
): number {
  return 10 + dex + armorBonus + shieldBonus + otherBonus;
}

export function calculateSkill(
  level: number,
  attr: number,
  isTrained: boolean,
  otherBonus: number = 0
): number {
  const halfLevel = Math.floor(level / 2);
  const trainingBonus = isTrained ? (level <= 6 ? 2 : level <= 14 ? 4 : 6) : 0;
  return halfLevel + attr + trainingBonus + otherBonus;
}
