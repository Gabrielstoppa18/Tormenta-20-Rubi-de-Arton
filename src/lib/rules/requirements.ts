import {
  Requirement,
  RequirementGroup,
  AttributeName,
  ValidatableCharacter,
} from './types';

// Map Portuguese attribute names to internal keys
const attributeMap: Record<string, AttributeName> = {
  'forca': 'for',
  'strength': 'for',
  'for': 'for',
  'destreza': 'des',
  'dexterity': 'des',
  'des': 'des',
  'constituicao': 'con',
  'constitution': 'con',
  'con': 'con',
  'inteligencia': 'int',
  'intelligence': 'int',
  'int': 'int',
  'sabedoria': 'sab',
  'wisdom': 'sab',
  'sab': 'sab',
  'carisma': 'car',
  'charisma': 'car',
  'car': 'car'
};

export function meetsRequirement(character: ValidatableCharacter, req: Requirement): boolean {
  switch (req.type) {
    case 'characterLevel':
      return character.level >= req.min;
    
    case 'classLevel':
      // Simplified: if character's main class matches and level meets min
      // For multiclassing this would need to track levels per class
      return character.class_id === req.classId && character.level >= req.min;
    
    case 'class':
      return character.class_id === req.classId;
    
    case 'attribute': {
      const internalAttr = attributeMap[req.attribute.toLowerCase()];
      if (!internalAttr) return false;
      const val = character.attributes[internalAttr] || 0;
      return val >= req.min;
    }
    
    case 'trainedSkill':
      return character.trainedSkills.some(s => s.toLowerCase() === req.skillId.toLowerCase());
    
    case 'power':
      return character.powers.some(p => p.toLowerCase() === req.powerId.toLowerCase());
    
    case 'race':
      return character.race_id === req.raceId;
    
    case 'deity':
      return character.deity === req.deityId;
    
    case 'canCastSpells':
      // Simplified check for common spellcasters
      return ['arcanista', 'clérigo', 'druida', 'bardo'].includes(character.class_id || '');
    
    case 'proficiency':
      return (character.proficiencies || []).includes(req.proficiencyId);
    
    default:
      return true;
  }
}

export function getRequirementFailureReason(character: ValidatableCharacter, req: Requirement): string | null {
  if (meetsRequirement(character, req)) return null;

  switch (req.type) {
    case 'characterLevel':
      return `Requer nível ${req.min}.`;
    case 'classLevel':
      return `Requer nível ${req.min} de ${req.classId}.`;
    case 'class':
      return `Requer ser da classe ${req.classId}.`;
    case 'attribute':
      return `Requer ${req.attribute.toUpperCase()} ${req.min}.`;
    case 'trainedSkill':
      return `Requer treinamento em ${req.skillId}.`;
    case 'power':
      return `Requer o poder ${req.powerId}.`;
    case 'race':
      return `Requer ser da raça ${req.raceId}.`;
    case 'deity':
      return `Requer ser devoto de ${req.deityId}.`;
    case 'canCastSpells':
      return `Requer habilidade de conjurar magias.`;
    case 'proficiency':
      return `Requer proficiência em ${req.proficiencyId}.`;
    default:
      return "Pré-requisito não atendido.";
  }
}

export function meetsRequirementGroup(character: ValidatableCharacter, group: RequirementGroup): boolean {
  // All requirements in a group must be met (AND)
  return group.every(req => meetsRequirement(character, req));
}

export function meetsRequirements(character: ValidatableCharacter, groups: RequirementGroup[]): boolean {
  // If no requirements, it's met
  if (groups.length === 0) return true;
  // Any group can be met (OR)
  return groups.some(group => meetsRequirementGroup(character, group));
}
