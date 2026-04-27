import { ClassRule, ClassAbilityByLevel } from './types';
import classesData from '../../data/rules/classes.rules.json';

const classesRules = classesData as ClassRule[];

export function getClassRule(classId: string): ClassRule | null {
  return classesRules.find(c => c.id.toLowerCase() === classId.toLowerCase()) || null;
}

export function getClassFixedAbilitiesByLevel(classId: string, level: number): ClassAbilityByLevel[] {
  const classRule = getClassRule(classId);
  if (!classRule) return [];

  return classRule.fixedAbilities.filter(ability => ability.level <= level);
}
