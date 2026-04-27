import { PowerRule, BlockedPower, ValidatableCharacter } from './types';
import { meetsRequirements, getRequirementFailureReason } from './requirements';
import powersData from '../../data/rules/powers.rules.json';

const powersRules = powersData as PowerRule[];
export { powersRules };

export function canChoosePower(character: ValidatableCharacter, power: PowerRule): boolean {
  // 1. Check if requirements are met
  if (!meetsRequirements(character, power.requirements)) {
    return false;
  }

  // 2. Check if already has it (unless repeatable)
  if (!power.repeatable && character.powers.some(p => p.toLowerCase() === power.id.toLowerCase() || p.toLowerCase() === power.name.toLowerCase())) {
    return false;
  }

  return true;
}

export function getAvailablePowers(character: ValidatableCharacter, powers: PowerRule[] = powersRules): PowerRule[] {
  return powers.filter(power => canChoosePower(character, power));
}

export function getBlockedPowers(character: ValidatableCharacter, powers: PowerRule[] = powersRules): BlockedPower[] {
  return powers
    .filter(power => !canChoosePower(character, power))
    .map(power => {
      // Find the first failing group to report a reason
      // For a more complete UI, we might want to show all failing groups if it's an AND/OR structure
      let reason = "Requisitos não atendidos.";
      
      if (power.requirements.length > 0) {
        // Find the group that is "closest" to being met? 
        // For now just take the first group as the user must meet at least one.
        // If there are multiple groups, it might be confusing which one to report.
        // We'll report the failures of the first group.
        const firstGroup = power.requirements[0];
        const failures = firstGroup
          .map(req => getRequirementFailureReason(character, req))
          .filter(f => f !== null) as string[];
        
        if (failures.length > 0) {
          reason = failures.join(" ");
        }
      }

      // Special case for already owned
      if (!power.repeatable && character.powers.some(p => p.toLowerCase() === power.id.toLowerCase() || p.toLowerCase() === power.name.toLowerCase())) {
        reason = "Este poder já foi escolhido e não é repetível.";
      }

      return { power, reason };
    });
}
