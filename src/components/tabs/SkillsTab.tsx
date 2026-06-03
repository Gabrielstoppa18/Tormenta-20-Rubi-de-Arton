import React from 'react';
import { Star, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCharacter } from '../../context/CharacterContext';
import { SKILLS_ATTRIBUTES } from '../../data/t20-data';
import type { VFXType } from '../../types/vfx';

interface SkillsTabProps {
  onRoll: (bonus: number, type?: VFXType, label?: string) => void;
}

export function SkillsTab({ onRoll }: SkillsTabProps) {
  const { state, calculateSkillValue, addTrainedSkill, removeTrainedSkill } = useCharacter();

  const sortedSkills = Object.keys(SKILLS_ATTRIBUTES).sort();

  return (
    <section className="bg-gothic-card p-8 border border-gothic-gold/10 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Star className="text-gothic-gold" size={20} />
        <h3 className="font-cinzel text-xl font-bold tracking-widest uppercase text-gothic-gold">Lista de Perícias</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-2">
        {sortedSkills.map((skillName) => {
          const isTrained = state.trainedSkills.includes(skillName);
          const bonus = calculateSkillValue(skillName);
          return (
            <div
              key={skillName}
              className={cn(
                'flex items-center justify-between p-2 border-b border-gothic-gold/5 transition-colors group',
                isTrained ? 'bg-gothic-gold/5' : 'hover:bg-gothic-card/40',
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isTrained) removeTrainedSkill(skillName);
                    else addTrainedSkill(skillName);
                  }}
                  className={cn(
                    'transition-colors',
                    isTrained ? 'text-gothic-gold' : 'text-gothic-text/20 hover:text-gothic-gold/40',
                  )}
                >
                  {isTrained ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </button>
                <span
                  onClick={() => onRoll(bonus, 'skill', skillName)}
                  className={cn(
                    'font-cinzel text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer',
                    isTrained ? 'text-gothic-gold' : 'text-gothic-text/60 group-hover:text-gothic-gold',
                  )}
                >
                  {skillName}
                  <span className="ml-1 text-[8px] font-normal opacity-40 normal-case tracking-normal">
                    ({(SKILLS_ATTRIBUTES[skillName] || '').toUpperCase()})
                  </span>
                </span>
              </div>
              <span
                onClick={() => onRoll(bonus, 'skill', skillName)}
                className="font-cinzel text-sm font-bold text-gothic-gold cursor-pointer"
              >
                {bonus >= 0 ? `+${bonus}` : bonus}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
