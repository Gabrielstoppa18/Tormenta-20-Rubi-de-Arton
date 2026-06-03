import React, { useState } from 'react';
import { Book, PlusCircle, Plus, Trash2, Flame, Hand, Zap, Shield, Target, Clock, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCharacter } from '../../context/CharacterContext';
import { SPELLS } from '../../data/t20-data';
import type { VFXType } from '../../types/vfx';

interface GrimoireTabProps {
  onTriggerVFX: (type: VFXType) => void;
}

export function GrimoireTab({ onTriggerVFX }: GrimoireTabProps) {
  const { state, addSpell, removeSpell, castSpell } = useCharacter();

  const [showAddSpell, setShowAddSpell] = useState(false);
  const [spellSearch, setSpellSearch] = useState('');
  const [spellCircleFilter, setSpellCircleFilter] = useState<number | null>(null);

  const availableSpells = SPELLS
    .filter(s => !state.spells.find(ss => ss.name === s.name))
    .filter(spell => {
      const matchesSearch = spell.name.toLowerCase().includes(spellSearch.toLowerCase());
      const matchesCircle = !spellCircleFilter || spell.circle === spellCircleFilter;
      return matchesSearch && matchesCircle;
    });

  return (
    <section className="bg-gothic-card p-8 border border-gothic-gold/10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Book className="text-gothic-gold" size={20} />
          <h3 className="font-cinzel text-xl font-bold tracking-widest uppercase text-gothic-gold">O Grimório Negro</h3>
        </div>
        <button
          onClick={() => setShowAddSpell(!showAddSpell)}
          className="flex items-center gap-2 text-xs font-bold text-gothic-gold hover:text-white transition-colors"
        >
          <PlusCircle size={16} />
          ADICIONAR MAGIA
        </button>
      </div>

      {showAddSpell && (
        <div className="space-y-4 mb-8 p-6 bg-black/40 border border-gothic-gold/20">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar magia..."
              value={spellSearch}
              onChange={(e) => setSpellSearch(e.target.value)}
              className="flex-1 bg-black/60 border border-gothic-gold/20 p-2 font-cinzel text-xs text-gothic-text outline-none focus:border-gothic-gold/40"
            />
            <select
              value={spellCircleFilter || ''}
              onChange={(e) => setSpellCircleFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="bg-black/60 border border-gothic-gold/20 p-2 font-cinzel text-xs text-gothic-text outline-none focus:border-gothic-gold/40"
            >
              <option value="">Todos os Círculos</option>
              {[1, 2, 3, 4, 5].map(circle => (
                <option key={circle} value={circle}>{circle}º Círculo</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 gothic-scroll">
            {availableSpells.map(spell => (
              <div key={spell.name} className="p-3 border border-gothic-gold/10 hover:border-gothic-gold/40 transition-colors bg-gothic-card/20 group">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-cinzel text-xs font-bold text-gothic-text group-hover:text-gothic-gold transition-colors">{spell.name}</h5>
                    <p className="text-[8px] text-gothic-text/40 uppercase">{spell.type} • {spell.circle}º Círculo • {spell.cost} PM</p>
                  </div>
                  <button
                    onClick={() => {
                      addSpell(spell);
                      onTriggerVFX('spell');
                    }}
                    className="text-gothic-gold hover:text-white transition-colors"
                    title="Aprender Magia"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {state.spells.map((spell) => (
          <div key={spell.name} className="p-4 bg-gothic-card/40 border border-gothic-gold/10 relative group">
            <button
              onClick={() => removeSpell(spell.name)}
              className="absolute top-2 right-2 text-gothic-red/40 hover:text-gothic-red opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={14} />
            </button>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="text-gothic-gold/60">
                  {spell.type === 'Divina' ? <Hand size={16} /> : <Flame size={16} />}
                </div>
                <h5 className="font-cinzel text-sm font-bold text-gothic-text">{spell.name}</h5>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gothic-blue bg-gothic-blue/10 px-1.5 py-0.5 border border-gothic-blue/20 uppercase tracking-tighter">
                  {spell.circle}º Círculo
                </span>
                <button
                  onClick={() => {
                    if (state.currentPM >= spell.cost) {
                      castSpell(spell.name);
                      onTriggerVFX('spell');
                    }
                  }}
                  disabled={state.currentPM < spell.cost}
                  className={cn(
                    'px-3 py-1 text-[10px] font-bold uppercase tracking-widest border transition-all',
                    state.currentPM >= spell.cost
                      ? 'bg-gothic-blue/20 border-gothic-blue text-gothic-blue hover:bg-gothic-blue hover:text-white'
                      : 'bg-gothic-red/10 border-gothic-red/20 text-gothic-red/40 cursor-not-allowed',
                  )}
                >
                  Conjurar ({spell.cost} PM)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-[9px] uppercase tracking-tighter">
              <div className="flex items-center gap-1.5 text-gothic-text/40">
                <Play size={10} className="text-gothic-gold/40" />
                <span className="font-bold text-gothic-text/60">Execução:</span> {spell.execution || 'Padrão'}
              </div>
              <div className="flex items-center gap-1.5 text-gothic-text/40">
                <Zap size={10} className="text-gothic-gold/40" />
                <span className="font-bold text-gothic-text/60">Alcance:</span> {spell.range || 'Curto'}
              </div>
              <div className="flex items-center gap-1.5 text-gothic-text/40">
                <Target size={10} className="text-gothic-gold/40" />
                <span className="font-bold text-gothic-text/60">Alvo:</span> {spell.target || '1 criatura'}
              </div>
              <div className="flex items-center gap-1.5 text-gothic-text/40">
                <Clock size={10} className="text-gothic-gold/40" />
                <span className="font-bold text-gothic-text/60">Duração:</span> {spell.duration || 'Instantânea'}
              </div>
              {spell.resistance && (
                <div className="flex items-center gap-1.5 text-gothic-text/40 col-span-2">
                  <Shield size={10} className="text-gothic-gold/40" />
                  <span className="font-bold text-gothic-text/60">Resistência:</span> {spell.resistance}
                </div>
              )}
            </div>

            <p className="text-xs text-gothic-text/50 italic leading-relaxed mb-4 border-l border-gothic-gold/10 pl-3">
              {spell.description}
            </p>

            {spell.enhancements && spell.enhancements.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-gothic-gold/5">
                <p className="text-[8px] font-bold text-gothic-gold uppercase tracking-widest">Aprimoramentos</p>
                {spell.enhancements.map((enh, idx) => (
                  <div key={idx} className="flex gap-2 items-start group/enh">
                    <span className="text-[9px] font-mono text-gothic-gold bg-gothic-gold/10 px-1.5 py-0.5 border border-gothic-gold/20">
                      +{enh.cost}
                    </span>
                    <p className="text-[10px] text-gothic-text/40 group-hover/enh:text-gothic-text/60 transition-colors leading-tight">
                      {enh.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
