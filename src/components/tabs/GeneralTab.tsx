import React, { useState } from 'react';
import { Settings, Trophy, PlusCircle, Plus, Trash2, ZapOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCharacter } from '../../context/CharacterContext';
import { CLASSES, RACES, DEITIES, POWERS, T20Power } from '../../data/t20-data';
import { powersRules, getBlockedPowers } from '../../lib/rules/powers';

// --- Attribute widget ---

interface AttributeProps {
  label: string;
  value: number;
  modifier: number;
  onUpdate: (val: number) => void;
}

const Attribute = ({ label, value, modifier, onUpdate }: AttributeProps) => (
  <div className="flex flex-col items-center group">
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div className="absolute inset-0 rotate-45 border-2 border-gothic-gold/40 bg-gothic-card group-hover:border-gothic-gold transition-colors duration-300" />
      <div className="relative z-10 flex flex-col items-center">
        <input
          type="number"
          value={value}
          onChange={(e) => onUpdate(parseInt(e.target.value) || 0)}
          className="w-10 bg-transparent text-center text-xl font-bold font-cinzel leading-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gothic-text"
        />
        <span className={cn(
          'text-[10px] font-bold mt-0.5 uppercase',
          modifier >= 0 ? 'text-gothic-gold' : 'text-gothic-red',
        )}>
          {modifier >= 0 ? `+${modifier}` : modifier}
        </span>
      </div>
    </div>
    <span className="mt-4 text-[10px] font-bold tracking-widest uppercase text-gothic-text/60 group-hover:text-gothic-gold transition-colors">
      {label}
    </span>
  </div>
);

// --- Helpers ---

function getPowerType(requirements: string[] | any): string {
  if (!Array.isArray(requirements)) return 'Geral';
  if (requirements.some((r: any) => typeof r === 'string' && r.startsWith('Raça:'))) return 'Raça';
  if (requirements.some((r: any) => typeof r === 'string' && r.startsWith('Origem:'))) return 'Origem';
  if (requirements.some((r: any) => typeof r === 'string' && r.startsWith('Classe:'))) return 'Classe';
  if (requirements.some((r: any) => typeof r === 'string' && r.startsWith('Divindade:'))) return 'Concedido';
  return 'Geral';
}

function formatRequirements(requirements: any): string[] {
  if (!Array.isArray(requirements) || requirements.length === 0) return [];
  if (typeof requirements[0] === 'string') return requirements;
  return requirements.map((group: any) => {
    if (!Array.isArray(group)) return String(group);
    return group.map((req: any) => {
      switch (req.type) {
        case 'characterLevel': return `Nível ${req.min}`;
        case 'classLevel': return `${req.classId} nível ${req.min}`;
        case 'attribute': return `${req.attribute.toUpperCase()} ${req.min}`;
        case 'power': return `Poder ${req.powerId}`;
        default: return req.type;
      }
    }).join(' e ');
  });
}

const POWER_FILTER_OPTIONS = ['Todos', 'Geral', 'Classe', 'Raça', 'Origem', 'Concedido'] as const;

// --- Component ---

export function GeneralTab() {
  const {
    state,
    modifiers,
    setAttribute,
    setName,
    setRace,
    setClass,
    setDeity,
    addPower,
    removePower,
    getValidatableCharacter,
  } = useCharacter();

  const [showAddPower, setShowAddPower] = useState(false);
  const [powerFilter, setPowerFilter] = useState<string>('Todos');

  const availablePowers = [
    ...POWERS,
    ...powersRules.map(pr => ({
      id: pr.id,
      name: pr.name,
      description: pr.summary,
      requirements: pr.requirements as any,
      type: pr.category,
      isRuleBased: true,
      rule: pr,
    })),
  ].filter(p => !state.powers.find(sp => sp.name === p.name))
   .filter(p => {
     const type = (p as any).isRuleBased ? (p as any).type : getPowerType(p.requirements);
     return powerFilter === 'Todos' || type.toLowerCase() === powerFilter.toLowerCase();
   });

  const charInfo = getValidatableCharacter();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Basic Info */}
      <section className="bg-gothic-card p-4 md:p-8 border border-gothic-gold/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Nome do Personagem</label>
            <input
              value={state.name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Raça</label>
            <select
              value={state.race}
              onChange={(e) => setRace(e.target.value)}
              className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
            >
              {Object.entries(RACES).map(([id, r]) => (
                <option key={id} value={id} className="bg-gothic-card">{r.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Classe</label>
            <select
              value={state.class}
              onChange={(e) => setClass(e.target.value)}
              className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
            >
              {Object.entries(CLASSES).map(([id, c]) => (
                <option key={id} value={id} className="bg-gothic-card">{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Divindade</label>
            <select
              value={state.deity}
              onChange={(e) => setDeity(e.target.value)}
              className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
            >
              <option value="" className="bg-gothic-card">Nenhuma</option>
              {Object.entries(DEITIES).map(([id, d]) => (
                <option key={id} value={id} className="bg-gothic-card">{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Attributes */}
      <section className="bg-gothic-card/30 p-4 md:p-8 border border-gothic-gold/5">
        <div className="flex items-center gap-4 mb-8">
          <Settings className="text-gothic-gold" size={20} />
          <h3 className="font-cinzel text-lg md:text-xl font-bold tracking-widest uppercase text-gothic-gold">Atributos (JdA)</h3>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8">
          <Attribute label="FOR" value={state.attributes.for} modifier={modifiers.for} onUpdate={(v) => setAttribute('for', v)} />
          <Attribute label="DES" value={state.attributes.des} modifier={modifiers.des} onUpdate={(v) => setAttribute('des', v)} />
          <Attribute label="CON" value={state.attributes.con} modifier={modifiers.con} onUpdate={(v) => setAttribute('con', v)} />
          <Attribute label="INT" value={state.attributes.int} modifier={modifiers.int} onUpdate={(v) => setAttribute('int', v)} />
          <Attribute label="SAB" value={state.attributes.sab} modifier={modifiers.sab} onUpdate={(v) => setAttribute('sab', v)} />
          <Attribute label="CAR" value={state.attributes.car} modifier={modifiers.car} onUpdate={(v) => setAttribute('car', v)} />
        </div>
      </section>

      {/* Powers */}
      <section className="bg-gothic-card p-4 md:p-8 border border-gothic-gold/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Trophy className="text-gothic-gold" size={20} />
            <h3 className="font-cinzel text-lg md:text-xl font-bold tracking-widest uppercase text-gothic-gold">Poderes e Habilidades</h3>
          </div>
          <button
            onClick={() => setShowAddPower(!showAddPower)}
            className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gothic-gold hover:text-white transition-colors"
          >
            <PlusCircle size={16} />
            ADICIONAR PODER
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {POWER_FILTER_OPTIONS.map(type => (
            <button
              key={type}
              onClick={() => setPowerFilter(type)}
              className={cn(
                'px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all',
                powerFilter === type
                  ? 'bg-gothic-gold text-gothic-bg border-gothic-gold'
                  : 'bg-black/20 text-gothic-gold/40 border-gothic-gold/10 hover:border-gothic-gold/40',
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {showAddPower && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-4 bg-black/40 border border-gothic-gold/20">
            {availablePowers.map(power => {
              let isBlocked = false;
              let reason = '';

              if ((power as any).isRuleBased) {
                const blocked = getBlockedPowers(charInfo, [(power as any).rule]);
                if (blocked.length > 0) {
                  isBlocked = true;
                  reason = blocked[0].reason;
                }
              }

              return (
                <div
                  key={power.name}
                  className={cn(
                    'p-3 border transition-colors relative group',
                    isBlocked ? 'border-gothic-red/20 opacity-60' : 'border-gothic-gold/10 hover:border-gothic-gold/40',
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h5 className={cn('font-cinzel text-xs font-bold', isBlocked ? 'text-gothic-red/60' : 'text-gothic-text')}>
                        {power.name}
                      </h5>
                      <span className="text-[8px] text-gothic-gold/40 uppercase tracking-tighter">
                        {(power as any).isRuleBased ? (power as any).type : getPowerType(power.requirements)}
                      </span>
                    </div>
                    {isBlocked ? (
                      <div className="text-gothic-red/60" title={reason}><ZapOff size={14} /></div>
                    ) : (
                      <button onClick={() => addPower(power as T20Power)} className="text-gothic-gold hover:text-white">
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gothic-text/40 mt-1 line-clamp-2">{power.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formatRequirements(power.requirements).map(req => (
                      <span key={req} className="text-[8px] px-1 py-0.5 bg-black/20 text-gothic-gold/30 border border-gothic-gold/5">
                        {req}
                      </span>
                    ))}
                  </div>
                  {isBlocked && <p className="text-[9px] text-gothic-red/80 mt-1 font-bold italic">{reason}</p>}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.powers
            .filter(p => {
              const type = p.type || getPowerType(p.requirements);
              return powerFilter === 'Todos' || type === powerFilter;
            })
            .map((power) => (
              <div key={power.id || power.name} className="p-4 bg-gothic-card/40 border border-gothic-gold/10 relative group">
                <button
                  onClick={() => removePower(power.id || power.name)}
                  className="absolute top-2 right-2 text-gothic-red/40 hover:text-gothic-red opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
                <div className="flex justify-between items-start">
                  <h5 className="font-cinzel text-sm font-bold text-gothic-gold">{power.name}</h5>
                  <span className="text-[8px] text-gothic-gold/40 uppercase tracking-tighter">{power.type || getPowerType(power.requirements)}</span>
                </div>
                <p className="text-[11px] text-gothic-text/60 mt-2 leading-relaxed">{power.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formatRequirements(power.requirements).map(req => (
                    <span key={req} className="text-[9px] px-1.5 py-0.5 bg-gothic-gold/5 text-gothic-gold/60 border border-gothic-gold/10">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
