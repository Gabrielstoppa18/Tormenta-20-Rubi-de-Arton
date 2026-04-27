import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Book, Sword, Shield, Plus, X, ChevronRight } from 'lucide-react';
import { compendiumService } from '../lib/compendium';
import { useCharacter, Attributes } from '../context/CharacterContext';
import type { Power, ClassPower } from '../types/database';
import { cn } from '../lib/utils';
import { POWERS, SPELLS, type T20Power, type T20Spell } from '../data/t20-data';
import { SKILLS_ATTRIBUTES } from '../data/t20-data';

interface LevelUpChoiceProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'attributes' | 'skills' | 'powers' | 'spells';

export function LevelUpChoice({ onComplete, onCancel }: LevelUpChoiceProps) {
  const { state, addPower, setAttribute, addTrainedSkill, addSpell } = useCharacter();
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    if (state.level > 1 && state.level % 4 === 0) return 'attributes';
    return 'powers';
  });
  
  const [selectedAttributes, setSelectedAttributes] = useState<(keyof Attributes)[]>([]);
  const [selectedPower, setSelectedPower] = useState<Power | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<T20Spell | null>(null);
  
  const [availablePowers, setAvailablePowers] = useState<Power[]>([]);
  const [availableSpells, setAvailableSpells] = useState<T20Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'class' | 'general'>('class');

  const isSpellcaster = ['arcanist', 'cleric', 'bard', 'druid'].includes(state.class);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (currentStep === 'powers') {
          const classPowers = await compendiumService.getClassPowers(state.class);
          const classPowerList = classPowers
            .map(cp => cp.power)
            .filter((p): p is Power => !!p && !state.powers.some(sp => sp.name === p.name));

          const generalPowers = await compendiumService.getPowers('Geral');
          const generalPowerList = generalPowers.filter(p => !state.powers.some(sp => sp.name === p.name));

          if (generalPowerList.length === 0) {
            const localPowers = POWERS.filter(p => !state.powers.some(sp => sp.name === p.name)).map(p => ({
              id: p.name.toLowerCase().replace(/\s+/g, '_'),
              name: p.name,
              description: p.description,
              power_type: p.requirements.some(r => r.startsWith('Raça:')) ? 'Raça' : 
                          p.requirements.some(r => r.startsWith('Origem:')) ? 'Origem' : 'Geral',
              requirement_text: p.requirements.join(', '),
              raw_data: p,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));
            
            const combined = [...classPowerList, ...localPowers];
            const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
            setAvailablePowers(unique);
          } else {
            const combined = [...classPowerList, ...generalPowerList];
            const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
            setAvailablePowers(unique);
          }
        } else if (currentStep === 'spells' && isSpellcaster) {
          const spells = await compendiumService.getSpells();
          const spellType = (state.class === 'cleric' || state.class === 'druid') ? 'Divina' : 'Arcana';
          const filteredSpells = spells.filter(s => 
            s.type === spellType && 
            !state.spells.some(ss => ss.name === s.name) &&
            s.circle === 1 // Simplified: assuming 1st circle for now
          );

          if (filteredSpells.length === 0) {
            setAvailableSpells(SPELLS.filter(s => 
              s.type === spellType && 
              !state.spells.some(ss => ss.name === s.name)
            ));
          } else {
            setAvailableSpells(filteredSpells);
          }
        }
      } catch (error) {
        console.error('Error loading level up data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [state.class, state.powers, state.spells, currentStep, isSpellcaster]);

  const handleNext = () => {
    if (currentStep === 'attributes') {
      // Apply attribute increases
      selectedAttributes.forEach(attr => {
        setAttribute(attr, state.attributes[attr] + 1);
      });
      
      if (selectedAttributes.includes('int')) {
        setCurrentStep('skills');
      } else {
        setCurrentStep('powers');
      }
    } else if (currentStep === 'skills') {
      if (selectedSkill) {
        addTrainedSkill(selectedSkill);
      }
      setCurrentStep('powers');
    } else if (currentStep === 'powers') {
      if (selectedPower) {
        addPower({
          id: selectedPower.id,
          name: selectedPower.name,
          description: selectedPower.description || '',
          requirements: selectedPower.requirement_text ? [selectedPower.requirement_text] : []
        });
      }
      
      if (isSpellcaster) {
        setCurrentStep('spells');
      } else {
        onComplete();
      }
    } else if (currentStep === 'spells') {
      if (selectedSpell) {
        addSpell(selectedSpell);
      }
      onComplete();
    }
  };

  const filteredPowers = availablePowers.filter(p => 
    tab === 'class' ? p.power_type !== 'Geral' : p.power_type === 'Geral'
  );

  const attributeNames: Record<keyof Attributes, string> = {
    for: 'Força',
    des: 'Destreza',
    con: 'Constituição',
    int: 'Inteligência',
    sab: 'Sabedoria',
    car: 'Carisma'
  };

  const allSkills = Object.keys(SKILLS_ATTRIBUTES);
  const availableSkills = allSkills.filter(s => !state.trainedSkills.includes(s));

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gothic-card border-2 border-gothic-gold w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(212,175,55,0.2)]"
      >
        <header className="p-6 border-b border-gothic-gold/20 flex justify-between items-center bg-black/40">
          <div>
            <h2 className="font-cinzel text-2xl font-bold text-gothic-gold flex items-center gap-3">
              <Sparkles className="text-gothic-gold animate-pulse" />
              AVANÇO DE NÍVEL: {state.level}
            </h2>
            <p className="text-gothic-text/40 text-[10px] uppercase tracking-widest mt-1">
              {currentStep === 'attributes' && "Aprimore seus Atributos"}
              {currentStep === 'skills' && "Treine uma nova Perícia"}
              {currentStep === 'powers' && "Escolha um novo Poder"}
              {currentStep === 'spells' && "Aprenda uma nova Magia"}
            </p>
          </div>
          <button onClick={onCancel} className="text-gothic-text/40 hover:text-gothic-red transition-colors">
            <X size={24} />
          </button>
        </header>

        {currentStep === 'attributes' && (
          <div className="flex-1 overflow-y-auto p-8 gothic-scroll">
            <div className="max-w-2xl mx-auto">
              <h3 className="font-cinzel text-xl text-gothic-gold mb-6 text-center">Aumento de Atributo</h3>
              <p className="text-gothic-text/60 text-sm mb-8 text-center">
                No nível {state.level}, você pode aumentar dois atributos diferentes em +1.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(Object.keys(attributeNames) as (keyof Attributes)[]).map(attr => (
                  <button
                    key={attr}
                    onClick={() => {
                      if (selectedAttributes.includes(attr)) {
                        setSelectedAttributes(prev => prev.filter(a => a !== attr));
                      } else if (selectedAttributes.length < 2) {
                        setSelectedAttributes(prev => [...prev, attr]);
                      }
                    }}
                    className={cn(
                      "p-6 border-2 transition-all flex flex-col items-center gap-2",
                      selectedAttributes.includes(attr)
                        ? "bg-gothic-gold/20 border-gothic-gold text-gothic-gold"
                        : "bg-black/20 border-gothic-gold/10 text-gothic-text/60 hover:border-gothic-gold/40"
                    )}
                  >
                    <span className="font-cinzel text-lg font-bold">{attributeNames[attr]}</span>
                    <span className="text-2xl font-bold">{state.attributes[attr]} → {state.attributes[attr] + (selectedAttributes.includes(attr) ? 1 : 0)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'skills' && (
          <div className="flex-1 overflow-y-auto p-8 gothic-scroll">
            <div className="max-w-2xl mx-auto">
              <h3 className="font-cinzel text-xl text-gothic-gold mb-6 text-center">Novo Treinamento</h3>
              <p className="text-gothic-text/60 text-sm mb-8 text-center">
                Sua Inteligência aumentou! Escolha uma nova perícia para se tornar treinado.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableSkills.map(skill => (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(skill)}
                    className={cn(
                      "p-3 text-sm border transition-all text-center font-cinzel",
                      selectedSkill === skill
                        ? "bg-gothic-gold/20 border-gothic-gold text-gothic-gold"
                        : "bg-black/20 border-gothic-gold/10 text-gothic-text/60 hover:border-gothic-gold/40"
                    )}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 'powers' && (
          <>
            <div className="flex border-b border-gothic-gold/10">
              <button 
                onClick={() => setTab('class')}
                className={cn(
                  "flex-1 py-4 font-cinzel text-xs tracking-widest transition-all",
                  tab === 'class' ? "bg-gothic-gold/10 text-gothic-gold border-b-2 border-gothic-gold" : "text-gothic-text/40 hover:text-gothic-text"
                )}
              >
                PODERES DE {state.class.toUpperCase()}
              </button>
              <button 
                onClick={() => setTab('general')}
                className={cn(
                  "flex-1 py-4 font-cinzel text-xs tracking-widest transition-all",
                  tab === 'general' ? "bg-gothic-gold/10 text-gothic-gold border-b-2 border-gothic-gold" : "text-gothic-text/40 hover:text-gothic-text"
                )}
              >
                PODERES GERAIS
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 gothic-scroll grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-full py-20 text-center font-cinzel text-gothic-gold animate-pulse">Consultando Grimórios...</div>
              ) : filteredPowers.length > 0 ? (
                filteredPowers.map(power => (
                  <button
                    key={power.id}
                    onClick={() => setSelectedPower(power)}
                    className={cn(
                      "p-5 text-left border transition-all duration-300 group relative overflow-hidden",
                      selectedPower?.id === power.id 
                        ? "bg-gothic-gold/10 border-gothic-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
                        : "bg-black/20 border-gothic-gold/10 hover:border-gothic-gold/40"
                    )}
                  >
                    <div className="relative z-10">
                      <h3 className="font-cinzel text-lg font-bold text-gothic-gold group-hover:tracking-wider transition-all">{power.name}</h3>
                      {power.requirement_text && (
                        <p className="text-[9px] text-gothic-red font-bold uppercase tracking-tighter mb-2">Requisito: {power.requirement_text}</p>
                      )}
                      <p className="text-xs text-gothic-text/60 leading-relaxed line-clamp-3">{power.description}</p>
                    </div>
                    {selectedPower?.id === power.id && (
                      <motion.div 
                        layoutId="active-power"
                        className="absolute inset-0 border-2 border-gothic-gold pointer-events-none" 
                      />
                    )}
                  </button>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border border-dashed border-gothic-gold/20">
                  <p className="font-cinzel text-gothic-text/40">Nenhum poder disponível nesta categoria.</p>
                </div>
              )}
            </div>
          </>
        )}

        {currentStep === 'spells' && (
          <div className="flex-1 overflow-y-auto p-6 gothic-scroll grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full py-20 text-center font-cinzel text-gothic-gold animate-pulse">Consultando Grimórios...</div>
            ) : availableSpells.length > 0 ? (
              availableSpells.map(spell => (
                <button
                  key={spell.name}
                  onClick={() => setSelectedSpell(spell)}
                  className={cn(
                    "p-5 text-left border transition-all duration-300 group relative overflow-hidden",
                    selectedSpell?.name === spell.name 
                      ? "bg-gothic-gold/10 border-gothic-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
                      : "bg-black/20 border-gothic-gold/10 hover:border-gothic-gold/40"
                  )}
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-cinzel text-lg font-bold text-gothic-gold group-hover:tracking-wider transition-all">{spell.name}</h3>
                      <span className="text-[10px] bg-gothic-gold/20 text-gothic-gold px-2 py-0.5 rounded uppercase font-bold tracking-tighter">
                        {spell.circle}º Círculo
                      </span>
                    </div>
                    <p className="text-[9px] text-gothic-red font-bold uppercase tracking-tighter mb-2">{spell.school}</p>
                    <p className="text-xs text-gothic-text/60 leading-relaxed line-clamp-3">{spell.description}</p>
                  </div>
                  {selectedSpell?.name === spell.name && (
                    <motion.div 
                      layoutId="active-spell"
                      className="absolute inset-0 border-2 border-gothic-gold pointer-events-none" 
                    />
                  )}
                </button>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border border-dashed border-gothic-gold/20">
                <p className="font-cinzel text-gothic-text/40">Nenhuma magia disponível para o seu nível.</p>
              </div>
            )}
          </div>
        )}

        <footer className="p-6 border-t border-gothic-gold/20 bg-black/40 flex justify-between items-center">
          <div className="max-w-[60%]">
            {currentStep === 'attributes' && (
              <p className="text-[10px] text-gothic-text/30 uppercase tracking-widest">
                {selectedAttributes.length === 2 ? "Atributos selecionados" : `Selecione mais ${2 - selectedAttributes.length} atributo(s)`}
              </p>
            )}
            {currentStep === 'skills' && (
              <p className="text-[10px] text-gothic-text/30 uppercase tracking-widest">
                {selectedSkill ? `Selecionado: ${selectedSkill}` : "Selecione uma perícia"}
              </p>
            )}
            {currentStep === 'powers' && (
              <div className="animate-in fade-in slide-in-from-left-2">
                {selectedPower ? (
                  <>
                    <p className="text-[10px] text-gothic-gold uppercase tracking-widest font-bold">Selecionado:</p>
                    <p className="font-cinzel text-sm text-gothic-text truncate">{selectedPower.name}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-gothic-text/30 uppercase tracking-widest">Selecione um poder para continuar</p>
                )}
              </div>
            )}
            {currentStep === 'spells' && (
              <div className="animate-in fade-in slide-in-from-left-2">
                {selectedSpell ? (
                  <>
                    <p className="text-[10px] text-gothic-gold uppercase tracking-widest font-bold">Selecionada:</p>
                    <p className="font-cinzel text-sm text-gothic-text truncate">{selectedSpell.name}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-gothic-text/30 uppercase tracking-widest">Selecione uma magia para continuar</p>
                )}
              </div>
            )}
          </div>
          <button
            disabled={
              (currentStep === 'attributes' && selectedAttributes.length < 2) ||
              (currentStep === 'skills' && !selectedSkill) ||
              (currentStep === 'powers' && !selectedPower) ||
              (currentStep === 'spells' && !selectedSpell)
            }
            onClick={handleNext}
            className="px-10 py-3 bg-gothic-gold text-gothic-bg font-cinzel font-bold tracking-widest hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2"
          >
            {(currentStep === 'powers' && !isSpellcaster) || currentStep === 'spells' ? 'FINALIZAR' : 'PRÓXIMO'} <ChevronRight size={18} />
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
