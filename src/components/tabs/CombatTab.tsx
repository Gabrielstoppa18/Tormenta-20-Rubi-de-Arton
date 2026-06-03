import React, { useState } from 'react';
import { Heart, Zap, Sword, Shield, Minus, Plus, RotateCcw, Skull, AlertTriangle, Flame, Hand, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useCharacter } from '../../context/CharacterContext';
import { ITEMS } from '../../data/t20-data';
import type { VFXType } from '../../types/vfx';

interface CombatTabProps {
  onRoll: (bonus: number, type?: VFXType, label?: string) => void;
  onRollDamage: (damage: string, name: string) => void;
  onTriggerVFX: (type: VFXType) => void;
}

const CONDITIONS = ['Fatigado', 'Debilitado', 'Esmorecido', 'Enredado', 'Abatido'] as const;

const CONDITION_EFFECTS: Record<string, string> = {
  Fatigado:  '−2 em todos os testes e Defesa',
  Debilitado:'−2 em atributos físicos (FOR, DES, CON)',
  Esmorecido:'−2 em atributos mentais (INT, SAB, CAR)',
  Enredado:  '−2 em testes de DES, não pode mover voluntariamente',
  Abatido:   '−2 em todos os testes e Defesa',
};

const QUICK_DAMAGE_PRESETS = [5, 8, 10, 15, 20, 30];
const QUICK_HEAL_PRESETS   = [5, 10, 15, 20];

type ActionType = 'padrao' | 'movimento' | 'livre' | 'reacao';

const ACTIONS: { id: ActionType; label: string; color: string; abbr: string }[] = [
  { id: 'padrao',   label: 'Padrão',   color: 'text-gothic-gold  border-gothic-gold/60   bg-gothic-gold/10',  abbr: 'P' },
  { id: 'movimento',label: 'Movimento', color: 'text-gothic-blue  border-gothic-blue/60   bg-gothic-blue/10',  abbr: 'M' },
  { id: 'livre',    label: 'Livre',     color: 'text-green-400    border-green-400/60     bg-green-400/10',    abbr: 'L' },
  { id: 'reacao',   label: 'Reação',    color: 'text-purple-400   border-purple-400/60    bg-purple-400/10',   abbr: 'R' },
];

export function CombatTab({ onRoll, onRollDamage, onTriggerVFX }: CombatTabProps) {
  const {
    state,
    modifiers,
    maxPV,
    maxPM,
    defesa,
    armorPenalty,
    resistencia,
    combate,
    takeDamage,
    spendPM,
    setDefenseBonus,
    toggleCondition,
    castSpell,
  } = useCharacter();

  // Quick damage/heal modal
  const [showDmgModal, setShowDmgModal] = useState(false);
  const [dmgMode, setDmgMode] = useState<'dano' | 'cura'>('dano');
  const [dmgValue, setDmgValue] = useState('');

  // Action economy tracker (local, not persisted — resets on refresh)
  const [usedActions, setUsedActions] = useState<Set<ActionType>>(new Set());

  const equippedArmor  = state.inventory.find(i => i.isEquipped && i.type.includes('Armadura'));
  const equippedShield = state.inventory.find(i => i.isEquipped && i.type.includes('Escudo'));
  const hasCondition   = (c: string) => state.conditions.includes(c);

  // Death/unconscious thresholds
  const deathThreshold = -(Math.floor(maxPV / 2));
  const pvPercent = maxPV > 0 ? Math.max(0, (state.currentPV / maxPV) * 100) : 0;
  const isUnconscious = state.currentPV <= 0;
  const isDead = state.currentPV <= deathThreshold;

  const pvBarColor = isDead
    ? 'bg-gray-700'
    : isUnconscious
      ? 'bg-gothic-red/40'
      : pvPercent > 50
        ? 'from-green-700 to-green-900'
        : pvPercent > 25
          ? 'from-yellow-600 to-orange-700'
          : 'from-gothic-red to-red-900';

  const applyDamage = () => {
    const val = parseInt(dmgValue);
    if (isNaN(val) || val <= 0) return;
    if (dmgMode === 'dano') takeDamage(val);
    else takeDamage(-val);
    setDmgValue('');
    setShowDmgModal(false);
  };

  const toggleAction = (id: ActionType) => {
    setUsedActions(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const resetActions = () => setUsedActions(new Set());

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* ── Death/Unconscious banner ── */}
      <AnimatePresence>
        {isDead && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3 bg-gray-900 border border-gray-600 text-gray-300"
          >
            <Skull size={18} className="text-gray-400" />
            <span className="font-cinzel text-sm font-bold uppercase tracking-widest">MORTO — {state.name} caiu em combate</span>
          </motion.div>
        )}
        {!isDead && isUnconscious && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-4 py-3 bg-gothic-red/10 border border-gothic-red/40 text-gothic-red animate-pulse"
          >
            <AlertTriangle size={18} />
            <span className="font-cinzel text-sm font-bold uppercase tracking-widest">
              INCONSCIENTE — {state.currentPV} PV (morte em {deathThreshold})
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action Economy ── */}
      <div className="bg-gothic-card p-4 border border-gothic-gold/10">
        <div className="flex items-center justify-between mb-3">
          <span className="font-cinzel text-[9px] font-bold text-gothic-gold/50 uppercase tracking-widest">Ações da Rodada</span>
          <button
            onClick={resetActions}
            className="flex items-center gap-1 text-[9px] text-gothic-text/30 hover:text-gothic-gold transition-colors font-cinzel uppercase tracking-widest"
          >
            <RotateCcw size={10} /> Nova Rodada
          </button>
        </div>
        <div className="flex gap-2">
          {ACTIONS.map(action => {
            const used = usedActions.has(action.id);
            return (
              <button
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={cn(
                  'flex-1 py-2 border font-cinzel text-[9px] font-bold uppercase tracking-widest transition-all duration-200',
                  used
                    ? 'bg-black/60 border-gothic-gold/10 text-gothic-text/20 line-through'
                    : action.color,
                )}
              >
                <span className="hidden md:inline">{action.label}</span>
                <span className="md:hidden">{action.abbr}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: PV / PM / Attacks ── */}
        <div className="lg:col-span-2 bg-gothic-card p-4 md:p-6 border border-gothic-gold/10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PV */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2 text-gothic-red">
                  <Heart size={14} />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Vida (PV)</span>
                  {isUnconscious && !isDead && (
                    <span className="text-[8px] px-1.5 py-0.5 bg-gothic-red/20 border border-gothic-red/40 text-gothic-red font-bold animate-pulse">
                      INCON.
                    </span>
                  )}
                  {isDead && (
                    <span className="text-[8px] px-1.5 py-0.5 bg-gray-800 border border-gray-600 text-gray-400 font-bold">
                      MORTO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => takeDamage(1)} className="text-gothic-red/60 hover:text-gothic-red"><Minus size={12} /></button>
                  <button
                    onClick={() => { setDmgMode('dano'); setShowDmgModal(true); }}
                    className="font-cinzel text-base md:text-lg text-gothic-text hover:text-gothic-gold transition-colors cursor-pointer"
                    title="Clique para aplicar dano/cura"
                  >
                    {state.currentPV} / {maxPV}
                  </button>
                  <button onClick={() => takeDamage(-1)} className="text-gothic-red/60 hover:text-gothic-red"><Plus size={12} /></button>
                </div>
              </div>

              {/* HP bar with death threshold marker */}
              <div className="relative h-4 bg-black border border-gothic-gold/20 overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ width: `${pvPercent}%` }}
                  className={cn('h-full', isDead ? pvBarColor : `bg-gradient-to-r ${pvBarColor} shadow-[0_0_10px_rgba(139,0,0,0.5)]`)}
                  transition={{ duration: 0.4 }}
                />
                {/* Death threshold marker */}
                {maxPV > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-gray-500/60"
                    style={{ right: '0%' }}
                    title={`Morte em ${deathThreshold} PV`}
                  />
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => { setDmgMode('dano'); setShowDmgModal(true); }}
                  className="text-[9px] px-2 py-1 border border-gothic-red/30 text-gothic-red/70 hover:bg-gothic-red/10 hover:text-gothic-red font-cinzel uppercase tracking-widest transition-all"
                >
                  ⚔ Aplicar Dano
                </button>
                <button
                  onClick={() => { setDmgMode('cura'); setShowDmgModal(true); }}
                  className="text-[9px] px-2 py-1 border border-green-700/40 text-green-600/70 hover:bg-green-900/20 hover:text-green-500 font-cinzel uppercase tracking-widest transition-all"
                >
                  ✚ Curar
                </button>
              </div>
            </div>

            {/* PM */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2 text-gothic-blue">
                  <Zap size={14} />
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Mana (PM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => spendPM(1)} className="text-gothic-blue/60 hover:text-gothic-blue"><Minus size={12} /></button>
                  <span className="font-cinzel text-base md:text-lg text-gothic-text">{state.currentPM} / {maxPM}</span>
                  <button onClick={() => spendPM(-1)} className="text-gothic-blue/60 hover:text-gothic-blue"><Plus size={12} /></button>
                </div>
              </div>
              <div className="h-4 bg-black border border-gothic-gold/20 p-0.5">
                <motion.div
                  initial={false}
                  animate={{ width: `${maxPM > 0 ? Math.max(0, (state.currentPM / maxPM) * 100) : 0}%` }}
                  className="h-full bg-gradient-to-r from-gothic-blue to-blue-900 shadow-[0_0_10px_rgba(26,58,90,0.5)]"
                />
              </div>
              <div className="flex gap-2 justify-end">
                {[1, 2, 3, 5].map(cost => (
                  <button
                    key={cost}
                    onClick={() => spendPM(cost)}
                    disabled={state.currentPM < cost}
                    className="text-[9px] px-2 py-1 border border-gothic-blue/20 text-gothic-blue/60 hover:bg-gothic-blue/10 hover:text-gothic-blue font-cinzel uppercase disabled:opacity-20 transition-all"
                  >
                    -{cost}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Attacks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-cinzel text-xs font-bold text-gothic-gold uppercase tracking-widest">Ataques</h4>
              <div className="flex gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-gothic-text/40 uppercase">Luta</span>
                  <span className="text-xs font-bold text-gothic-gold">+{combate.luta}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] text-gothic-text/40 uppercase">Pontaria</span>
                  <span className="text-xs font-bold text-gothic-gold">+{combate.pontaria}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {combate.ataques.map((ataque, idx) => (
                <div key={idx} className="p-3 bg-black/40 border border-gothic-gold/10 group hover:border-gothic-gold/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sword size={14} className="text-gothic-gold/60" />
                      <div>
                        <h5 className="font-cinzel text-sm font-bold text-gothic-text">{ataque.name}</h5>
                        <p className="text-[9px] text-gothic-text/40 uppercase tracking-tighter">
                          {ataque.damage} | Crit {ataque.criticalRange > 20 ? 20 : ataque.criticalRange}/×{ataque.criticalMultiplier}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRoll(ataque.bonus, 'attack', `Ataque: ${ataque.name}`)}
                        className="px-3 py-1.5 bg-gothic-gold/10 border border-gothic-gold/30 text-gothic-gold font-cinzel text-[9px] font-bold hover:bg-gothic-gold hover:text-gothic-bg transition-all"
                      >
                        +{ataque.bonus}
                      </button>
                      <button
                        onClick={() => onRollDamage(ataque.damage, ataque.name)}
                        className="px-3 py-1.5 bg-gothic-red/10 border border-gothic-red/30 text-gothic-red font-cinzel text-[9px] font-bold hover:bg-gothic-red hover:text-white transition-all"
                      >
                        Dano
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Spells in combat ── */}
          {state.spells.length > 0 && (
            <div className="space-y-3 border-t border-gothic-gold/10 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-cinzel text-xs font-bold text-gothic-blue uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} /> Magias
                </h4>
                <span className="text-[8px] text-gothic-text/30 font-cinzel">
                  {state.currentPM} / {maxPM} PM disponíveis
                </span>
              </div>
              <div className="space-y-2">
                {state.spells.map(spell => {
                  const canCast = state.currentPM >= spell.cost;
                  const SpellIcon = spell.type === 'Divina' ? Hand : Flame;
                  return (
                    <div
                      key={spell.name}
                      className={cn(
                        'p-3 border transition-colors',
                        canCast
                          ? 'bg-black/40 border-gothic-blue/20 hover:border-gothic-blue/40'
                          : 'bg-black/20 border-gothic-gold/5 opacity-50',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SpellIcon size={13} className={canCast ? 'text-gothic-blue/70' : 'text-gothic-text/20'} />
                          <div>
                            <h5 className="font-cinzel text-sm font-bold text-gothic-text leading-tight">{spell.name}</h5>
                            <p className="text-[8px] text-gothic-text/40 uppercase tracking-tighter">
                              {spell.circle}º Círculo • {spell.execution || 'Padrão'} • {spell.range || 'Curto'}
                              {spell.resistance && ` • ${spell.resistance}`}
                            </p>
                          </div>
                        </div>
                        <button
                          disabled={!canCast}
                          onClick={() => {
                            castSpell(spell.name);
                            onTriggerVFX('spell');
                          }}
                          className={cn(
                            'px-3 py-1.5 font-cinzel text-[9px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap',
                            canCast
                              ? 'bg-gothic-blue/20 border-gothic-blue text-gothic-blue hover:bg-gothic-blue hover:text-white'
                              : 'border-gothic-red/20 text-gothic-red/40 cursor-not-allowed',
                          )}
                        >
                          {spell.cost} PM
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Defense / Conditions / Resistances ── */}
        <div className="space-y-6">
          {/* Defense */}
          <div className="bg-gothic-card p-6 border border-gothic-gold/10 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Shield size={90} className="text-gothic-gold/10 fill-gothic-gold/5" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-[8px] font-bold text-gothic-gold/60 uppercase tracking-[0.2em] mb-1">Defesa</span>
                <p className="font-cinzel text-4xl font-bold text-gothic-gold leading-none">{defesa}</p>
              </div>
            </div>

            <div className="w-full pt-3 border-t border-gothic-gold/5 text-left">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[9px]">
                <div className="text-gothic-text/50">Base</div><div className="text-right text-gothic-gold">10</div>
                <div className="text-gothic-text/50">DES</div><div className="text-right text-gothic-gold">{modifiers.des >= 0 ? '+' : ''}{modifiers.des}</div>
                {equippedArmor && <><div className="text-gothic-text/50">Armadura</div><div className="text-right text-gothic-gold">+{ITEMS[equippedArmor.name]?.defenseBonus || 0}</div></>}
                {equippedShield && <><div className="text-gothic-text/50">Escudo</div><div className="text-right text-gothic-gold">+{ITEMS[equippedShield.name]?.defenseBonus || 0}</div></>}
                {state.defenseBonus !== 0 && <><div className="text-gothic-text/50">Outros</div><div className="text-right text-gothic-gold">{state.defenseBonus > 0 ? '+' : ''}{state.defenseBonus}</div></>}
                {(hasCondition('Fatigado') || hasCondition('Abatido')) && <><div className="text-gothic-red/60">Cond.</div><div className="text-right text-gothic-red">−2</div></>}
                {hasCondition('Enredado') && <><div className="text-gothic-red/60">Enredado</div><div className="text-right text-gothic-red">−2 DES</div></>}
              </div>
            </div>

            <div className="w-full flex justify-between items-center pt-3 border-t border-gothic-gold/5">
              <span className="text-[9px] font-bold text-gothic-text/30 uppercase tracking-widest">Ajuste</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setDefenseBonus(state.defenseBonus - 1)} className="text-gothic-gold/60 hover:text-gothic-gold"><Minus size={14} /></button>
                <span className="font-cinzel text-sm font-bold text-gothic-gold">{state.defenseBonus}</span>
                <button onClick={() => setDefenseBonus(state.defenseBonus + 1)} className="text-gothic-gold/60 hover:text-gothic-gold"><Plus size={14} /></button>
              </div>
            </div>
          </div>

          {/* Conditions with tooltips */}
          <div className="bg-gothic-card p-5 border border-gothic-gold/10 space-y-3">
            <h4 className="font-cinzel text-[9px] font-bold text-gothic-gold uppercase tracking-widest border-b border-gothic-gold/10 pb-2">Condições</h4>
            <div className="space-y-1.5">
              {CONDITIONS.map(cond => (
                <button
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-[9px] font-bold uppercase tracking-tighter border transition-all',
                    state.conditions.includes(cond)
                      ? 'bg-gothic-red/15 border-gothic-red text-gothic-red'
                      : 'bg-black/30 border-gothic-gold/10 text-gothic-text/40 hover:border-gothic-gold/30',
                  )}
                >
                  <span>{cond}</span>
                  {state.conditions.includes(cond) && (
                    <span className="text-[7px] font-normal normal-case tracking-normal text-gothic-red/60 text-right max-w-[55%] leading-tight">
                      {CONDITION_EFFECTS[cond]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Resistances */}
          <div className="bg-gothic-card p-5 border border-gothic-gold/10 space-y-3">
            <h4 className="font-cinzel text-[9px] font-bold text-gothic-gold uppercase tracking-widest border-b border-gothic-gold/10 pb-2">Resistências</h4>
            <div className="space-y-1.5">
              {([
                { label: 'Fortitude (CON)', value: resistencia.fortitude },
                { label: 'Reflexos (DES)', value: resistencia.reflexos },
                { label: 'Vontade (SAB)', value: resistencia.vontade },
              ] as const).map(({ label, value }) => (
                <div
                  key={label}
                  onClick={() => onRoll(value, 'skill', label)}
                  className="flex justify-between items-center p-2 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors border border-transparent hover:border-gothic-gold/20"
                >
                  <span className="text-[9px] font-bold text-gothic-text/50 uppercase tracking-widest">{label}</span>
                  <span className="font-cinzel text-sm font-bold text-gothic-gold">+{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment / Other stats */}
          <div className="bg-gothic-card p-5 border border-gothic-gold/10 space-y-3">
            <div className="flex justify-between items-center border-b border-gothic-gold/10 pb-2">
              <h4 className="font-cinzel text-[9px] font-bold text-gothic-gold uppercase tracking-widest">Outros</h4>
              {armorPenalty > 0 && (
                <span className="text-[7px] font-bold text-gothic-red uppercase">Penalidade armadura: −{armorPenalty}</span>
              )}
            </div>
            <div className="space-y-1.5">
              {([
                { label: 'Iniciativa', value: combate.iniciativa },
                { label: 'Percepção', value: combate.percepcao },
              ] as const).map(({ label, value }) => (
                <div
                  key={label}
                  onClick={() => onRoll(value, 'skill', label)}
                  className="flex justify-between items-center p-2 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors border border-transparent hover:border-gothic-gold/20"
                >
                  <span className="text-[9px] font-bold text-gothic-text/50 uppercase tracking-widest">{label}</span>
                  <span className="font-cinzel text-sm font-bold text-gothic-gold">+{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center p-2 text-[9px]">
                <span className="text-gothic-text/40 uppercase font-bold tracking-widest">Armadura</span>
                <span className="text-gothic-text/70">{equippedArmor?.name || 'Nenhuma'}</span>
              </div>
              <div className="flex justify-between items-center p-2 text-[9px]">
                <span className="text-gothic-text/40 uppercase font-bold tracking-widest">Escudo</span>
                <span className="text-gothic-text/70">{equippedShield?.name || 'Nenhum'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Damage / Heal Modal ── */}
      <AnimatePresence>
        {showDmgModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowDmgModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gothic-card border border-gothic-gold/30 p-6 w-full max-w-sm mx-4 space-y-4"
            >
              {/* Mode toggle */}
              <div className="flex">
                <button
                  onClick={() => setDmgMode('dano')}
                  className={cn(
                    'flex-1 py-2 font-cinzel text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all',
                    dmgMode === 'dano' ? 'border-gothic-red text-gothic-red' : 'border-transparent text-gothic-text/30 hover:text-gothic-red/60',
                  )}
                >
                  ⚔ Dano
                </button>
                <button
                  onClick={() => setDmgMode('cura')}
                  className={cn(
                    'flex-1 py-2 font-cinzel text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all',
                    dmgMode === 'cura' ? 'border-green-500 text-green-400' : 'border-transparent text-gothic-text/30 hover:text-green-600/60',
                  )}
                >
                  ✚ Cura
                </button>
              </div>

              <div className="text-center">
                <p className="text-[9px] text-gothic-text/40 uppercase tracking-widest mb-1">
                  PV atual: <span className="text-gothic-gold font-bold">{state.currentPV}</span> / {maxPV}
                </p>
              </div>

              {/* Input */}
              <input
                type="number"
                min="1"
                autoFocus
                value={dmgValue}
                onChange={e => setDmgValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyDamage()}
                placeholder="Quantidade..."
                className="w-full bg-black/60 border border-gothic-gold/30 p-3 font-cinzel text-2xl text-center text-gothic-text outline-none focus:border-gothic-gold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              {/* Presets */}
              <div className="flex gap-2 flex-wrap">
                {(dmgMode === 'dano' ? QUICK_DAMAGE_PRESETS : QUICK_HEAL_PRESETS).map(v => (
                  <button
                    key={v}
                    onClick={() => setDmgValue(String(v))}
                    className={cn(
                      'flex-1 py-1.5 border font-cinzel text-xs font-bold transition-all',
                      dmgValue === String(v)
                        ? dmgMode === 'dano' ? 'bg-gothic-red border-gothic-red text-white' : 'bg-green-700 border-green-600 text-white'
                        : 'border-gothic-gold/20 text-gothic-gold/50 hover:border-gothic-gold',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Apply / Preview */}
              {dmgValue && !isNaN(parseInt(dmgValue)) && (
                <p className="text-center text-[10px] text-gothic-text/50">
                  {dmgMode === 'dano'
                    ? `${state.currentPV} − ${dmgValue} = `
                    : `${state.currentPV} + ${dmgValue} = `}
                  <span className={cn('font-bold', dmgMode === 'dano' ? 'text-gothic-red' : 'text-green-400')}>
                    {dmgMode === 'dano'
                      ? state.currentPV - parseInt(dmgValue)
                      : Math.min(maxPV, state.currentPV + parseInt(dmgValue))} PV
                  </span>
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDmgModal(false)}
                  className="flex-1 py-2.5 border border-gothic-gold/20 text-gothic-text/40 hover:text-gothic-gold font-cinzel text-[10px] uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={applyDamage}
                  disabled={!dmgValue || isNaN(parseInt(dmgValue))}
                  className={cn(
                    'flex-1 py-2.5 font-cinzel text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40',
                    dmgMode === 'dano'
                      ? 'bg-gothic-red text-white hover:bg-red-700'
                      : 'bg-green-800 text-green-100 hover:bg-green-700',
                  )}
                >
                  {dmgMode === 'dano' ? 'Aplicar Dano' : 'Curar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
