export type AttributeName = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car';

export type Requirement =
  | { type: "characterLevel"; min: number }
  | { type: "classLevel"; classId: string; min: number }
  | { type: "class"; classId: string }
  | { type: "attribute"; attribute: string; min: number }
  | { type: "trainedSkill"; skillId: string }
  | { type: "power"; powerId: string }
  | { type: "race"; raceId: string }
  | { type: "deity"; deityId: string }
  | { type: "canCastSpells"; value: boolean }
  | { type: "proficiency"; proficiencyId: string };

export type RequirementGroup = Requirement[];

export interface EffectRule {
  type: string;
  [key: string]: any;
}

export interface PowerRule {
  id: string;
  name: string;
  category: "classe" | "combate" | "destino" | "magia" | "concedido" | "tormenta" | "origem" | "raca";
  source?: string;
  powerType?: string;
  summary: string;
  requirements: RequirementGroup[];
  effects: EffectRule[];
  repeatable: boolean;
  auditNote?: string;
}

export interface SkillChoiceRule {
  kind: "fixed" | "choice";
  skill?: string;
  choose?: number;
  options?: string[];
}

export interface ClassAbilityByLevel {
  level: number;
  abilityId: string;
}

export interface ClassRule {
  id: string;
  name: string;
  mainAttributes: string[];
  initialPV: number;
  pvPerLevel: number;
  pmPerLevel: number;
  mandatorySkills: SkillChoiceRule[];
  optionalSkills: SkillChoiceRule;
  proficiencies: string[];
  fixedAbilities: ClassAbilityByLevel[];
  classPowerType: string;
  auditStatus?: string;
}

export interface BlockedPower {
  power: PowerRule;
  reason: string;
}
