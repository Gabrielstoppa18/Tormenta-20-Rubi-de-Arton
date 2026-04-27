import { CLASSES, RACES } from '../data/t20-data';

export function calculateModifier(value: number): number {
  // In T20 Jogo do Ano, the attribute value IS the modifier.
  return value;
}

export function calculatePV(
  classData: { initialPV: number; pvPerLevel: number },
  level: number,
  con: number,
  hasVitalidade: boolean = false,
  otherBonus: number = 0
): number {
  if (!classData) return 0;
  
  // Initial PV = Base + CON
  // Per level = Gain + CON
  // Vitalidade = +2 per level
  const basePV = classData.initialPV + con;
  const perLevelPV = classData.pvPerLevel + con + (hasVitalidade ? 2 : 0);
  
  return basePV + (level - 1) * perLevelPV + otherBonus;
}

export function calculatePM(
  classData: { initialPM?: number; pmPerLevel: number },
  level: number,
  hasVontadeDeFerro: boolean = false,
  hasSangueMagico: boolean = false,
  otherBonus: number = 0
): number {
  if (!classData) return 0;
  
  // Base gain per level
  // Vontade de Ferro = +1 per level
  // Sangue Mágico = +1 per level
  const perLevelPM = classData.pmPerLevel + (hasVontadeDeFerro ? 1 : 0) + (hasSangueMagico ? 1 : 0);
  const initialPM = classData.initialPM || classData.pmPerLevel;
  
  return initialPM + (level - 1) * perLevelPM + otherBonus;
}

export function calculateDefesa(
  dex: number,
  armorBonus: number = 0,
  shieldBonus: number = 0,
  otherBonus: number = 0
): number {
  return 10 + dex + armorBonus + shieldBonus + otherBonus;
}

export function calculateCargaMaxima(forca: number, hasMochileiro: boolean = false): number {
  // Base 10 + 2 * FOR. Mochileiro adds 5 spaces.
  return 10 + (2 * forca) + (hasMochileiro ? 5 : 0);
}

export function calculateArmorPenalty(equippedItems: { penalty?: number }[]): number {
  return equippedItems.reduce((acc, item) => acc + (item.penalty || 0), 0);
}

export function calculateSkill(
  level: number,
  attr: number,
  isTrained: boolean,
  otherBonus: number = 0,
  armorPenalty: number = 0,
  isPenaltyApplicable: boolean = false
): number {
  const halfLevel = Math.floor(level / 2);
  const trainingBonus = isTrained ? (level >= 15 ? 6 : level >= 7 ? 4 : 2) : 0;
  const penalty = isPenaltyApplicable ? armorPenalty : 0;
  return halfLevel + attr + trainingBonus + otherBonus - penalty;
}

export function calculateResistencia(
  level: number,
  attr: number,
  isTrained: boolean,
  otherBonus: number = 0
): number {
  // Reflexes don't suffer armor penalty in JdA
  return calculateSkill(level, attr, isTrained, otherBonus);
}

export function calculateAtaque(
  level: number,
  attr: number,
  isTrained: boolean,
  otherBonus: number = 0
): number {
  return calculateSkill(level, attr, isTrained, otherBonus);
}

export function calculateIniciativa(
  level: number,
  des: number,
  isTrained: boolean,
  otherBonus: number = 0
): number {
  return calculateSkill(level, des, isTrained, otherBonus);
}

export function calculatePercepcao(
  level: number,
  sab: number,
  isTrained: boolean,
  otherBonus: number = 0
): number {
  return calculateSkill(level, sab, isTrained, otherBonus);
}
