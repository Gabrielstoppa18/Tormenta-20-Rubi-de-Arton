import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sword, User, Book, Plus, Minus, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { compendiumService } from '../lib/compendium';
import { characterService } from '../lib/character';
import type { Race, Class, Origin, Power } from '../types/database';
import { cn } from '../lib/utils';
import SheetBuilder, { RaceFactory, RoleFactory, OriginFactory, Translator, ArcanistFactory, RoleName } from 't20-sheet-builder';
import { Roles } from '../lib/compendium';

interface CharacterCreationProps {
  onComplete: (characterId: string) => void;
  onCancel: () => void;
  userId: string;
}

// --- Constants ---

const DEFAULT_CLASS_SKILLS: Record<string, string[][]> = {
  arcanist: [['knowledge', 'diplomacy']],
  warrior: [['fight'], ['animalHandling', 'athletics']],
  barbarian: [['animalHandling', 'athletics', 'animalRide', 'initiative']],
  buccaneer: [['fight'], ['acrobatics', 'athletics', 'acting', 'cheat']],
  bard: [['acrobatics', 'animalRide', 'knowledge', 'diplomacy', 'cheat', 'stealth']],
  ranger: [['fight'], ['animalHandling', 'athletics', 'animalRide', 'cure', 'fortitude', 'stealth']],
  knight: [['animalHandling', 'athletics']],
  cleric: [['knowledge', 'cure']],
  druid: [['animalHandling', 'athletics', 'animalRide', 'knowledge']],
  inventor: [['knowledge', 'cure', 'diplomacy', 'fortitude']],
  rogue: [['acrobatics', 'athletics', 'acting', 'animalRide', 'knowledge', 'diplomacy', 'cheat', 'stealth']],
  fighter: [['acrobatics', 'animalHandling', 'athletics', 'cheat']],
  noble: [['diplomacy', 'intimidation'], ['animalHandling', 'acting', 'animalRide', 'knowledge']],
  paladin: [['animalHandling', 'athletics']],
};

const DEFAULT_ORIGIN_BENEFITS: Record<string, any[]> = {
  acolyte: [{ type: 'skills', name: 'religion' }, { type: 'skills', name: 'will' }],
  animalFriend: [{ type: 'skills', name: 'animalHandling' }, { type: 'skills', name: 'survival' }],
  artisan: [{ type: 'skills', name: 'craft' }, { type: 'skills', name: 'will' }],
  aristocrat: [{ type: 'skills', name: 'diplomacy' }, { type: 'skills', name: 'nobility' }],
  assistant: [{ type: 'skills', name: 'investigation' }, { type: 'skills', name: 'knowledge' }],
  charlatan: [{ type: 'skills', name: 'cheat' }, { type: 'skills', name: 'thievery' }],
  criminal: [{ type: 'skills', name: 'thievery' }, { type: 'skills', name: 'stealth' }],
  gladiator: [{ type: 'skills', name: 'fight' }, { type: 'skills', name: 'intimidation' }],
  hermit: [{ type: 'skills', name: 'nature' }, { type: 'skills', name: 'survival' }],
  laborer: [{ type: 'skills', name: 'athletics' }, { type: 'skills', name: 'fortitude' }],
  merchant: [{ type: 'skills', name: 'diplomacy' }, { type: 'skills', name: 'thievery' }],
  miner: [{ type: 'skills', name: 'athletics' }, { type: 'skills', name: 'fortitude' }],
  nomad: [{ type: 'skills', name: 'survival' }, { type: 'skills', name: 'perception' }],
  sailor: [{ type: 'skills', name: 'athletics' }, { type: 'skills', name: 'reflexes' }],
  soldier: [{ type: 'skills', name: 'fight' }, { type: 'skills', name: 'fortitude' }],
  student: [{ type: 'skills', name: 'investigation' }, { type: 'skills', name: 'knowledge' }],
  tavernKeeper: [{ type: 'skills', name: 'diplomacy' }, { type: 'skills', name: 'fortitude' }],
  traveler: [{ type: 'skills', name: 'survival' }, { type: 'skills', name: 'knowledge' }],
  venerated: [{ type: 'skills', name: 'religion' }, { type: 'skills', name: 'intuition' }],
  wildChild: [{ type: 'skills', name: 'nature' }, { type: 'skills', name: 'survival' }],
};

export function CharacterCreation({ onComplete, onCancel, userId }: CharacterCreationProps) {
  const [step, setStep] = useState(1);
  const [races, setRaces] = useState<Race[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [availablePowers, setAvailablePowers] = useState<Power[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    race_id: '',
    class_id: '',
    origin_id: '',
    attributes_base: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
    initial_powers: [] as string[]
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [r, c, o] = await Promise.all([
          compendiumService.getRaces(),
          compendiumService.getClasses(),
          compendiumService.getOrigins()
        ]);
        
        setRaces(r);
        setClasses(c);
        // Only allow Acolyte and Animal Friend as requested
        setOrigins(o.filter(origin => ['acolyte', 'animalFriend'].includes(origin.id)));
        
        const p = await compendiumService.getPowers('Geral');
        setAvailablePowers(p);
      } catch (error) {
        console.error('Error loading compendium data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCreate = async () => {
    try {
      // Use SheetBuilder to validate and calculate final stats
      const builder = new SheetBuilder();
      
      // 1. Set Attributes (Map from FOR/DES to strength/dexterity)
      builder.setInitialAttributes({
        strength: formData.attributes_base.for,
        dexterity: formData.attributes_base.des,
        constitution: formData.attributes_base.con,
        intelligence: formData.attributes_base.int,
        wisdom: formData.attributes_base.sab,
        charisma: formData.attributes_base.car
      });
      
      // 2. Choose Race
      if (formData.race_id) {
        let race;
        if (formData.race_id === 'human') {
          race = (RaceFactory as any).makeHuman({
            name: 'human' as any,
            selectedAttributes: ['strength', 'dexterity'], // Default choices
            versatileChoices: [{ type: 'skill', name: 'athletics' }] // Default choice
          } as any);
        } else if (formData.race_id === 'qareen') {
          race = (RaceFactory as any).makeQareen({
            name: 'qareen' as any,
            qareenType: 'light',
            mysticTattooSpell: 'arcaneArmor'
          } as any);
        } else if (formData.race_id === 'lefeu') {
          race = (RaceFactory as any).makeLefeu({
            name: 'lefeu' as any,
            selectedAttributes: ['strength', 'dexterity', 'constitution'],
            deformityChoices: [{ name: 'claws' }],
            previousRace: 'human'
          } as any);
        } else {
          race = RaceFactory.makeFromSerialized({ name: formData.race_id as any } as any);
        }
        builder.chooseRace(race);
      }
      
      // 3. Choose Role (Class)
      if (formData.class_id) {
        let role;
        if (formData.class_id === RoleName.arcanist) {
          role = ArcanistFactory.makeFromSerialized({ 
            name: RoleName.arcanist, 
            selectedSkillsByGroup: DEFAULT_CLASS_SKILLS.arcanist || [[]],
            path: { name: 'wizard', spells: ['arcaneArmor'] },
            initialSpells: ['arcaneArmor', 'magicMissile', 'shield']
          } as any);
        } else if (formData.class_id === RoleName.warrior) {
          role = RoleFactory.makeFromSerialized({ 
            name: RoleName.warrior, 
            selectedSkillsByGroup: DEFAULT_CLASS_SKILLS.warrior || [[]],
          } as any);
        } else {
          // For other classes, instantiate directly using Roles map from compendium
          const RoleClass = (Roles as any).get(formData.class_id);
          if (RoleClass) {
            const defaultSkills = DEFAULT_CLASS_SKILLS[formData.class_id] || [[]];
            role = new RoleClass(defaultSkills);
          }
        }
        
        if (role) {
          builder.chooseRole(role);
        }
      }
      
      // 4. Choose Origin
      if (formData.origin_id) {
        const origin = OriginFactory.makeFromSerialized({ 
          name: formData.origin_id as any, 
          chosenBenefits: DEFAULT_ORIGIN_BENEFITS[formData.origin_id] || [],
          chosenAnimal: 'dog' // For AnimalsFriend
        } as any);
        builder.chooseOrigin(origin);
      }

      const sheet = builder.build();
      const attributes = sheet.getSheetAttributes().getValues();
      const maxHP = sheet.getMaxLifePoints();
      const maxMP = sheet.getMaxManaPoints();
      
      const character = await characterService.createCharacter({
        name: formData.name,
        user_id: userId,
        race_id: formData.race_id,
        class_id: formData.class_id,
        origin_id: formData.origin_id,
        level: 1,
        attributes_base: {
          for: attributes.strength,
          des: attributes.dexterity,
          con: attributes.constitution,
          int: attributes.intelligence,
          sab: attributes.wisdom,
          car: attributes.charisma
        },
        current_hp: maxHP,
        current_mp: maxMP
      });

      // Add initial powers
      if (formData.initial_powers.length > 0) {
        await Promise.all(formData.initial_powers.map(powerId => 
          characterService.addPowerToCharacter(character.id, powerId, 'initial', 1)
        ));
      }

      onComplete(character.id);
    } catch (error) {
      console.error('Error creating character:', error);
      alert('Erro ao criar personagem. Verifique se a combinação de raça/classe é válida.');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gothic-bg flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-gothic-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-cinzel text-gothic-gold tracking-widest animate-pulse">Invocando Dados do Compêndio...</p>
        </div>
      </div>
    );
  }

  const totalPoints = Object.values(formData.attributes_base).reduce((a, b) => (a as number) + (b as number), 0) as number;
  const remainingPoints = 10 - totalPoints;

  const attrMapping = {
    for: 'strength',
    des: 'dexterity',
    con: 'constitution',
    int: 'intelligence',
    sab: 'wisdom',
    car: 'charisma'
  } as const;

  return (
    <div className="fixed inset-0 bg-gothic-bg z-50 overflow-y-auto gothic-scroll">
      <div className="max-w-4xl mx-auto p-8 py-16">
        <header className="text-center mb-16 relative">
          <button 
            onClick={onCancel}
            className="absolute left-0 top-0 text-gothic-gold/40 hover:text-gothic-gold transition-colors font-cinzel text-xs flex items-center gap-1"
          >
            <ChevronLeft size={14} /> CANCELAR
          </button>
          <h1 className="font-cinzel text-4xl font-bold text-gothic-gold mb-2 tracking-tighter">Criação de Personagem</h1>
          <div className="h-1 w-32 bg-gothic-red mx-auto" />
          <p className="text-gothic-text/40 text-xs uppercase tracking-[0.3em] mt-4">Passo {step} de 4</p>
        </header>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-gothic-card p-8 border border-gothic-gold/20">
                <label className="block font-cinzel text-sm text-gothic-gold mb-4 uppercase tracking-widest">Como você será conhecido em Arthon?</label>
                <input 
                  type="text"
                  placeholder="Ex: Sir Alistair, o Audaz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-gothic-gold/20 p-4 font-cinzel text-xl text-gothic-text focus:border-gothic-gold outline-none transition-colors"
                />
              </div>

              <div className="bg-gothic-card p-8 border border-gothic-gold/20">
                <div className="flex justify-between items-center mb-6">
                  <label className="block font-cinzel text-sm text-gothic-gold uppercase tracking-widest">Distribua seus Atributos</label>
                  <div className="px-3 py-1 bg-gothic-gold/10 border border-gothic-gold/20">
                    <span className="text-[10px] text-gothic-gold font-bold uppercase tracking-widest">Pontos: {remainingPoints}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  {(Object.keys(formData.attributes_base) as Array<keyof typeof formData.attributes_base>).map(attr => (
                    <div key={attr} className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">
                        {Translator.getAttributeTranslation(attrMapping[attr]).substring(0, 3)}
                      </span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setFormData(f => ({ ...f, attributes_base: { ...f.attributes_base, [attr]: f.attributes_base[attr] - 1 } }))}
                          className="w-8 h-8 flex items-center justify-center border border-gothic-gold/20 hover:border-gothic-gold text-gothic-gold transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-cinzel text-2xl font-bold text-gothic-text w-8 text-center">{formData.attributes_base[attr]}</span>
                        <button 
                          disabled={remainingPoints <= 0}
                          onClick={() => setFormData(f => ({ ...f, attributes_base: { ...f.attributes_base, [attr]: f.attributes_base[attr] + 1 } }))}
                          className="w-8 h-8 flex items-center justify-center border border-gothic-gold/20 hover:border-gothic-gold text-gothic-gold transition-colors disabled:opacity-20"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gothic-text/30 mt-8 text-center uppercase tracking-widest">Dica: Em T20 Jogo do Ano, os atributos começam em 0 e você tem 10 pontos para distribuir (máximo 4).</p>
              </div>

              <div className="flex justify-end">
                <button 
                  disabled={!formData.name || remainingPoints !== 0}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-8 py-3 bg-gothic-gold text-gothic-bg font-cinzel font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  PRÓXIMO <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {races.map(race => (
                  <button
                    key={race.id}
                    onClick={() => setFormData({ ...formData, race_id: race.id })}
                    className={cn(
                      "p-6 text-left border transition-all duration-300",
                      formData.race_id === race.id 
                        ? "bg-gothic-gold/10 border-gothic-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
                        : "bg-gothic-card border-gothic-gold/10 hover:border-gothic-gold/40"
                    )}
                  >
                    <h3 className="font-cinzel text-xl font-bold text-gothic-gold mb-2">{race.name}</h3>
                    <p className="text-xs text-gothic-text/60 line-clamp-3 leading-relaxed">{race.description}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gothic-gold font-cinzel font-bold"><ChevronLeft size={18} /> VOLTAR</button>
                <button 
                  disabled={!formData.race_id}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-8 py-3 bg-gothic-gold text-gothic-bg font-cinzel font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  PRÓXIMO <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setFormData({ ...formData, class_id: cls.id })}
                    className={cn(
                      "p-6 text-left border transition-all duration-300",
                      formData.class_id === cls.id 
                        ? "bg-gothic-gold/10 border-gothic-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
                        : "bg-gothic-card border-gothic-gold/10 hover:border-gothic-gold/40"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-cinzel text-xl font-bold text-gothic-gold">{cls.name}</h3>
                      <div className="flex gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 bg-gothic-red/10 text-gothic-red border border-gothic-red/20">{cls.hp_initial} PV</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-gothic-blue/10 text-gothic-blue border border-gothic-blue/20">{cls.mana_per_level} PM</span>
                      </div>
                    </div>
                    <p className="text-xs text-gothic-text/60 line-clamp-3 leading-relaxed">{cls.description}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gothic-gold font-cinzel font-bold"><ChevronLeft size={18} /> VOLTAR</button>
                <button 
                  disabled={!formData.class_id}
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 px-8 py-3 bg-gothic-gold text-gothic-bg font-cinzel font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  PRÓXIMO <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {origins.map(origin => (
                  <button
                    key={origin.id}
                    onClick={() => setFormData({ ...formData, origin_id: origin.id })}
                    className={cn(
                      "p-6 text-left border transition-all duration-300",
                      formData.origin_id === origin.id 
                        ? "bg-gothic-gold/10 border-gothic-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
                        : "bg-gothic-card border-gothic-gold/10 hover:border-gothic-gold/40"
                    )}
                  >
                    <h3 className="font-cinzel text-xl font-bold text-gothic-gold mb-2">{origin.name}</h3>
                    <p className="text-xs text-gothic-text/60 line-clamp-3 leading-relaxed">{origin.description}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="flex items-center gap-2 text-gothic-gold font-cinzel font-bold"><ChevronLeft size={18} /> VOLTAR</button>
                <button 
                  disabled={!formData.origin_id}
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-8 py-3 bg-gothic-red text-white font-cinzel font-bold hover:bg-red-600 transition-colors shadow-[0_0_20px_rgba(139,0,0,0.4)]"
                >
                  FORJAR PERSONAGEM <Sparkles size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
