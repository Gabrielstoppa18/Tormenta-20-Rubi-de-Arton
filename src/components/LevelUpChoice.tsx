import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Book, Shield, Plus, X, ChevronRight, Lock, Check, Sword, Star } from 'lucide-react';
import { useCharacter, Attributes } from '../context/CharacterContext';
import { cn } from '../lib/utils';
import { CLASSES, POWERS, SPELLS, SKILLS_ATTRIBUTES, type T20Power, type T20Spell } from '../data/t20-data';
import { CLASS_POWERS } from '../data/class-powers';

const ALL_POWERS: T20Power[] = [...POWERS, ...CLASS_POWERS];

// ---------------------------------------------------------------------------
// Requirement parser — validates power requirements against character state
// ---------------------------------------------------------------------------

const ATTR_REQ_MAP: Record<string, keyof Attributes> = {
  FOR: 'for', DES: 'des', CON: 'con', INT: 'int', SAB: 'sab', CAR: 'car',
};

function checkSingleReq(req: string, state: ReturnType<typeof useCharacter>['state']): boolean {
  const trimmed = req.trim();

  // Attribute: "FOR 1", "DES 2", "SAB 13" etc.
  const attrMatch = trimmed.match(/^(FOR|DES|CON|INT|SAB|CAR)\s+(-?\d+)$/i);
  if (attrMatch) {
    const key = ATTR_REQ_MAP[attrMatch[1].toUpperCase()];
    return key ? (state.attributes[key] >= parseInt(attrMatch[2])) : true;
  }

  // Skill trained: "Luta treinada", "Pontaria treinada"
  const trainedMatch = trimmed.match(/^(.+?)\s+treinad[ao]$/i);
  if (trainedMatch) {
    return state.trainedSkills.includes(trainedMatch[1].trim());
  }

  // Level: "Nível 6", "nível 10"
  const levelMatch = trimmed.match(/[Nn]ível\s+(\d+)/);
  if (levelMatch) {
    return state.level >= parseInt(levelMatch[1]);
  }

  // Has power: just a power name without other keywords
  if (!trimmed.startsWith('Classe:') && !trimmed.startsWith('Raça:') &&
      !trimmed.startsWith('Origem:') && !trimmed.startsWith('Divindade:')) {
    // Might be a power prerequisite — check if character has it
    const hasPower = state.powers.some(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (hasPower) return true;
    // If it looks like a power name (multi-word, no numbers), flag as unmet
    if (/^[A-ZÀ-Ú]/.test(trimmed) && !/\d/.test(trimmed)) return hasPower;
  }

  return true; // Unknown requirement type — don't block
}

interface ReqResult { met: boolean; failures: string[] }

function checkRequirements(requirements: string[], state: ReturnType<typeof useCharacter>['state']): ReqResult {
  const failures: string[] = [];
  for (const req of requirements) {
    if (!checkSingleReq(req, state)) failures.push(req);
  }
  return { met: failures.length === 0, failures };
}

// ---------------------------------------------------------------------------
// Max spell circle accessible by level
// Arcanista/Bardo/Clérigo/Druida: 1st at L1, 2nd at L5, 3rd at L9, 4th at L13, 5th at L17
// ---------------------------------------------------------------------------

function maxSpellCircle(level: number): number {
  if (level >= 17) return 5;
  if (level >= 13) return 4;
  if (level >= 9)  return 3;
  if (level >= 5)  return 2;
  return 1;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LevelUpChoiceProps {
  onComplete: () => void;
  onCancel:   () => void;
}

type Step = 'attributes' | 'skills' | 'powers' | 'spells';

const ATTR_LABELS: Record<keyof Attributes, string> = {
  for: 'Força', des: 'Destreza', con: 'Constituição',
  int: 'Inteligência', sab: 'Sabedoria', car: 'Carisma',
};

const ATTR_ABBR: Record<keyof Attributes, string> = {
  for: 'FOR', des: 'DES', con: 'CON', int: 'INT', sab: 'SAB', car: 'CAR',
};

const CASTER_CLASSES = new Set(['arcanist', 'cleric', 'bard', 'druid']);
const SPELL_TYPE_MAP: Record<string, 'Arcana' | 'Divina' | 'Universal'> = {
  arcanist: 'Arcana',
  bard:     'Arcana',
  cleric:   'Divina',
  druid:    'Divina',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LevelUpChoice({ onComplete, onCancel }: LevelUpChoiceProps) {
  const { state, addPower, setAttribute, addTrainedSkill, addSpell } = useCharacter();

  const isAttrLevel = state.level > 1 && state.level % 4 === 0;
  const [currentStep, setCurrentStep] = useState<Step>(isAttrLevel ? 'attributes' : 'powers');

  const [selectedAttributes, setSelectedAttributes] = useState<(keyof Attributes)[]>([]);
  const [selectedPower,  setSelectedPower]  = useState<T20Power | null>(null);
  const [selectedSkill,  setSelectedSkill]  = useState<string | null>(null);
  const [selectedSpell,  setSelectedSpell]  = useState<T20Spell | null>(null);
  const [tab, setTab] = useState<'class' | 'general'>('class');

  const isSpellcaster = CASTER_CLASSES.has(state.class);
  const className     = CLASSES[state.class]?.name || state.class;
  const spellType     = SPELL_TYPE_MAP[state.class];
  const maxCircle     = maxSpellCircle(state.level);

  // ── Power lists ──────────────────────────────────────────────────────────

  const { classPowers, generalPowers } = useMemo(() => {
    const already = new Set(state.powers.map(p => p.name.toLowerCase()));

    // Class powers: requirements include "Classe: [ClassName]" (uses ALL_POWERS = POWERS + CLASS_POWERS)
    const cls = ALL_POWERS
      .filter(p => p.requirements.some(r =>
        r.toLowerCase().startsWith('classe:') &&
        r.toLowerCase().includes(className.toLowerCase())
      ))
      // Exclude subclass powers and lineage/pact powers — those are chosen at creation, not levelup
      .filter(p => !['subclasse_arcanista_mago', 'subclasse_arcanista_feiticeiro', 'subclasse_arcanista_bruxo',
        'linhagem_draconica', 'linhagem_abissal', 'linhagem_tormenta', 'linhagem_fada', 'linhagem_infernal', 'linhagem_anao',
        'pacto_corrente', 'pacto_tomo', 'pacto_lamina',
      ].includes(p.id || ''))
      .filter(p => !already.has(p.name.toLowerCase()));

    // General powers: no class/race/origin/deity restriction
    const gen = POWERS
      .filter(p => !p.requirements.some(r =>
        r.toLowerCase().startsWith('classe:') ||
        r.toLowerCase().startsWith('raça:') ||
        r.toLowerCase().startsWith('origem:') ||
        r.toLowerCase().startsWith('divindade:')
      ))
      .filter(p => !already.has(p.name.toLowerCase()));

    return { classPowers: cls, generalPowers: gen };
  }, [state.class, state.powers, className]);

  // ── Spell list ────────────────────────────────────────────────────────────

  const availableSpells = useMemo(() => {
    const already = new Set(state.spells.map(s => s.name.toLowerCase()));
    return SPELLS.filter(s =>
      (s.type === spellType || s.type === 'Universal') &&
      s.circle <= maxCircle &&
      !already.has(s.name.toLowerCase())
    );
  }, [state.spells, spellType, maxCircle]);

  // ── Trained skills not yet learned ───────────────────────────────────────

  const availableSkills = useMemo(() =>
    Object.keys(SKILLS_ATTRIBUTES).sort().filter(s => !state.trainedSkills.includes(s)),
    [state.trainedSkills]
  );

  // ── Navigation ────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (currentStep === 'attributes') {
      selectedAttributes.forEach(attr => setAttribute(attr, state.attributes[attr] + 1));
      const newInt = state.attributes.int + (selectedAttributes.includes('int') ? 1 : 0);
      setCurrentStep(selectedAttributes.includes('int') && newInt > 0 ? 'skills' : 'powers');

    } else if (currentStep === 'skills') {
      if (selectedSkill) addTrainedSkill(selectedSkill);
      setCurrentStep('powers');

    } else if (currentStep === 'powers') {
      if (selectedPower) {
        addPower({
          id: selectedPower.id || crypto.randomUUID(),
          name: selectedPower.name,
          description: selectedPower.description || '',
          requirements: selectedPower.requirements || [],
          type: selectedPower.type,
        });
      }
      if (isSpellcaster) setCurrentStep('spells');
      else onComplete();

    } else if (currentStep === 'spells') {
      if (selectedSpell) addSpell(selectedSpell);
      onComplete();
    }
  };

  const canNext =
    (currentStep === 'attributes' && selectedAttributes.length === 2) ||
    (currentStep === 'skills'     && !!selectedSkill) ||
    (currentStep === 'powers'     && !!selectedPower) ||
    (currentStep === 'spells'     && !!selectedSpell);

  const stepLabel: Record<Step, string> = {
    attributes: 'Aprimore seus Atributos',
    skills:     'Treine uma Nova Perícia',
    powers:     'Escolha um Novo Poder',
    spells:     `Aprenda uma Nova Magia (até ${maxCircle}º Círculo)`,
  };

  const isLastStep =
    (currentStep === 'powers' && !isSpellcaster) ||
    currentStep === 'spells';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-gothic-card border-2 border-gothic-gold w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_60px_rgba(212,175,55,0.15)]"
      >
        {/* Header */}
        <header className="px-6 py-5 border-b border-gothic-gold/20 flex justify-between items-center bg-black/50 flex-shrink-0">
          <div>
            <h2 className="font-cinzel text-xl font-bold text-gothic-gold flex items-center gap-3">
              <Sparkles size={18} className="text-gothic-gold animate-pulse" />
              AVANÇO DE NÍVEL: {state.level}
            </h2>
            <p className="text-gothic-text/40 text-[9px] uppercase tracking-widest mt-0.5">
              {stepLabel[currentStep]}
            </p>
          </div>
          <button onClick={onCancel} className="text-gothic-text/30 hover:text-gothic-red transition-colors p-1">
            <X size={20} />
          </button>
        </header>

        {/* ── STEP: Attributes ── */}
        {currentStep === 'attributes' && (
          <div className="flex-1 overflow-y-auto p-6 gothic-scroll">
            <p className="text-center text-gothic-text/50 text-sm mb-6 font-cinzel">
              Escolha <span className="text-gothic-gold font-bold">2 atributos</span> para receber +1
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {(Object.keys(ATTR_LABELS) as (keyof Attributes)[]).map(attr => {
                const isSelected = selectedAttributes.includes(attr);
                const currentVal = state.attributes[attr];
                return (
                  <button
                    key={attr}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedAttributes(prev => prev.filter(a => a !== attr));
                      } else if (selectedAttributes.length < 2) {
                        setSelectedAttributes(prev => [...prev, attr]);
                      }
                    }}
                    className={cn(
                      'p-5 border-2 transition-all flex flex-col items-center gap-1',
                      isSelected
                        ? 'bg-gothic-gold/15 border-gothic-gold'
                        : selectedAttributes.length >= 2
                          ? 'bg-black/20 border-gothic-gold/10 opacity-40 cursor-not-allowed'
                          : 'bg-black/20 border-gothic-gold/10 hover:border-gothic-gold/50',
                    )}
                  >
                    <span className="font-cinzel text-[9px] font-bold text-gothic-gold/60 uppercase tracking-widest">{ATTR_ABBR[attr]}</span>
                    <span className="font-cinzel text-sm text-gothic-text/60">{ATTR_LABELS[attr]}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-cinzel text-2xl font-bold text-gothic-text">{currentVal}</span>
                      {isSelected && (
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="font-cinzel text-xl font-bold text-gothic-gold"
                        >
                          → {currentVal + 1}
                        </motion.span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP: Skills ── */}
        {currentStep === 'skills' && (
          <div className="flex-1 overflow-y-auto p-6 gothic-scroll">
            <p className="text-center text-gothic-text/50 text-sm mb-6 font-cinzel">
              Sua <span className="text-gothic-gold font-bold">Inteligência</span> aumentou — escolha uma perícia para treinar
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-w-3xl mx-auto">
              {availableSkills.map(skill => {
                const attr = (SKILLS_ATTRIBUTES as any)[skill] || '';
                return (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(skill)}
                    className={cn(
                      'p-3 text-left border transition-all font-cinzel',
                      selectedSkill === skill
                        ? 'bg-gothic-gold/15 border-gothic-gold text-gothic-gold'
                        : 'bg-black/20 border-gothic-gold/10 text-gothic-text/60 hover:border-gothic-gold/40',
                    )}
                  >
                    <span className="text-xs font-bold block">{skill}</span>
                    <span className="text-[8px] text-gothic-text/30 uppercase">{attr.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP: Powers ── */}
        {currentStep === 'powers' && (
          <>
            {/* Tab bar */}
            <div className="flex border-b border-gothic-gold/10 flex-shrink-0">
              <button
                onClick={() => { setTab('class'); setSelectedPower(null); }}
                className={cn(
                  'flex-1 py-3 font-cinzel text-[10px] tracking-widest uppercase transition-all border-b-2',
                  tab === 'class'
                    ? 'bg-gothic-gold/5 text-gothic-gold border-gothic-gold'
                    : 'text-gothic-text/40 border-transparent hover:text-gothic-gold/60',
                )}
              >
                <Sword size={12} className="inline mr-2" />
                Poderes de {className}
                <span className="ml-2 text-[8px] opacity-60">({classPowers.length})</span>
              </button>
              <button
                onClick={() => { setTab('general'); setSelectedPower(null); }}
                className={cn(
                  'flex-1 py-3 font-cinzel text-[10px] tracking-widest uppercase transition-all border-b-2',
                  tab === 'general'
                    ? 'bg-gothic-gold/5 text-gothic-gold border-gothic-gold'
                    : 'text-gothic-text/40 border-transparent hover:text-gothic-gold/60',
                )}
              >
                <Star size={12} className="inline mr-2" />
                Poderes Gerais
                <span className="ml-2 text-[8px] opacity-60">({generalPowers.length})</span>
              </button>
            </div>

            {/* Power grid */}
            <PowerGrid
              powers={tab === 'class' ? classPowers : generalPowers}
              selected={selectedPower}
              onSelect={setSelectedPower}
              state={state}
              emptyLabel={
                tab === 'class'
                  ? `Nenhum poder de ${className} disponível nos dados locais.`
                  : 'Nenhum poder geral disponível.'
              }
            />
          </>
        )}

        {/* ── STEP: Spells ── */}
        {currentStep === 'spells' && (
          <div className="flex-1 overflow-y-auto p-4 gothic-scroll">
            {/* Circle filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="font-cinzel text-[9px] text-gothic-text/40 uppercase tracking-widest self-center">Círculos acessíveis:</span>
              {Array.from({ length: maxCircle }, (_, i) => i + 1).map(c => (
                <span key={c} className="px-2 py-0.5 bg-gothic-blue/10 border border-gothic-blue/30 text-gothic-blue text-[9px] font-bold font-cinzel">
                  {c}º
                </span>
              ))}
            </div>

            {availableSpells.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-gothic-gold/20">
                <p className="font-cinzel text-gothic-text/40">Nenhuma magia disponível.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableSpells.map(spell => {
                  const isSelected = selectedSpell?.name === spell.name;
                  return (
                    <button
                      key={spell.name}
                      onClick={() => setSelectedSpell(isSelected ? null : spell)}
                      className={cn(
                        'p-4 text-left border transition-all relative',
                        isSelected
                          ? 'bg-gothic-blue/10 border-gothic-blue'
                          : 'bg-black/20 border-gothic-gold/10 hover:border-gothic-gold/30',
                      )}
                    >
                      {isSelected && <Check size={14} className="absolute top-3 right-3 text-gothic-blue" />}
                      <div className="flex items-start justify-between mb-1 pr-5">
                        <h3 className="font-cinzel text-sm font-bold text-gothic-gold">{spell.name}</h3>
                        <span className={cn(
                          'text-[8px] font-bold px-1.5 py-0.5 border ml-2 flex-shrink-0',
                          'bg-gothic-blue/10 border-gothic-blue/40 text-gothic-blue',
                        )}>
                          {spell.circle}º
                        </span>
                      </div>
                      <p className="text-[8px] text-gothic-gold/50 font-bold uppercase tracking-tighter mb-1.5">
                        {spell.school} • {spell.execution || 'Padrão'} • {spell.range || 'Curto'} • {spell.cost} PM
                      </p>
                      <p className="text-[10px] text-gothic-text/50 leading-relaxed line-clamp-2">{spell.description}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-gothic-gold/20 bg-black/50 flex justify-between items-center flex-shrink-0">
          <div className="min-w-0 flex-1 mr-4">
            {!canNext && (
              <p className="text-[9px] text-gothic-text/30 uppercase tracking-widest font-cinzel">
                {currentStep === 'attributes' && `Selecione ${2 - selectedAttributes.length} atributo(s) mais`}
                {currentStep === 'skills' && 'Selecione uma perícia'}
                {currentStep === 'powers' && 'Selecione um poder para continuar'}
                {currentStep === 'spells' && 'Selecione uma magia para continuar'}
              </p>
            )}
            {canNext && (
              <div className="text-[9px] uppercase tracking-widest font-cinzel animate-in fade-in">
                <span className="text-gothic-gold/50">Selecionado: </span>
                <span className="text-gothic-gold font-bold">
                  {currentStep === 'attributes' && selectedAttributes.map(a => ATTR_ABBR[a]).join(' + ')}
                  {currentStep === 'skills'     && selectedSkill}
                  {currentStep === 'powers'     && selectedPower?.name}
                  {currentStep === 'spells'     && selectedSpell?.name}
                </span>
              </div>
            )}
          </div>
          <button
            disabled={!canNext}
            onClick={handleNext}
            className={cn(
              'px-8 py-3 font-cinzel font-bold tracking-widest transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-40',
              isLastStep
                ? 'bg-gothic-gold text-gothic-bg hover:bg-white shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                : 'border border-gothic-gold text-gothic-gold hover:bg-gothic-gold hover:text-gothic-bg',
            )}
          >
            {isLastStep ? <><Sparkles size={15} /> FINALIZAR</> : <>PRÓXIMO <ChevronRight size={16} /></>}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PowerGrid sub-component
// ---------------------------------------------------------------------------

interface PowerGridProps {
  powers: T20Power[];
  selected: T20Power | null;
  onSelect: (p: T20Power | null) => void;
  state: ReturnType<typeof useCharacter>['state'];
  emptyLabel: string;
}

function PowerGrid({ powers, selected, onSelect, state, emptyLabel }: PowerGridProps) {
  if (powers.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <p className="font-cinzel text-gothic-text/30 text-center">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 gothic-scroll">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {powers.map(power => {
          const isSelected = selected?.name === power.name;
          const { met, failures } = checkRequirements(power.requirements, state);

          return (
            <button
              key={power.name}
              onClick={() => {
                if (!met) return; // locked
                onSelect(isSelected ? null : power);
              }}
              className={cn(
                'p-4 text-left border transition-all relative',
                !met && 'opacity-50 cursor-not-allowed',
                isSelected && met && 'bg-gothic-gold/10 border-gothic-gold',
                !isSelected && met && 'bg-black/20 border-gothic-gold/10 hover:border-gothic-gold/30',
                !met && 'bg-black/10 border-gothic-gold/5',
              )}
            >
              {/* Lock icon for unmet requirements */}
              {!met && (
                <Lock size={12} className="absolute top-3 right-3 text-gothic-text/30" />
              )}
              {isSelected && met && (
                <Check size={12} className="absolute top-3 right-3 text-gothic-gold" />
              )}

              <div className="pr-5">
                <h3 className={cn(
                  'font-cinzel text-sm font-bold mb-0.5',
                  isSelected ? 'text-gothic-gold' : met ? 'text-gothic-text' : 'text-gothic-text/40',
                )}>
                  {power.name}
                </h3>

                {/* Requirements */}
                {power.requirements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {power.requirements.map(req => {
                      const reqMet = checkSingleReq(req, state);
                      return (
                        <span
                          key={req}
                          className={cn(
                            'text-[7px] px-1.5 py-0.5 font-bold uppercase tracking-tighter border',
                            reqMet
                              ? 'text-green-500/70 border-green-800/40 bg-green-900/10'
                              : 'text-gothic-red/70 border-gothic-red/30 bg-gothic-red/5',
                          )}
                        >
                          {req}
                        </span>
                      );
                    })}
                  </div>
                )}

                <p className={cn(
                  'text-[10px] leading-relaxed line-clamp-3',
                  met ? 'text-gothic-text/50' : 'text-gothic-text/30',
                )}>
                  {power.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
