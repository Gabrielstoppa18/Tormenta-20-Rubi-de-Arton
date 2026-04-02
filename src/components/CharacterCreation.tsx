import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sword, User, Book, Plus, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { compendiumService } from '../lib/compendium';
import { characterService } from '../lib/character';
import type { Race, Class, Origin } from '../types/database';
import { cn } from '../lib/utils';

interface CharacterCreationProps {
  onComplete: (characterId: string) => void;
  userId: string;
}

export function CharacterCreation({ onComplete, userId }: CharacterCreationProps) {
  const [step, setStep] = useState(1);
  const [races, setRaces] = useState<Race[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    race_id: '',
    class_id: '',
    origin_id: '',
    attributes_base: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 }
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
        setOrigins(o);
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
      const character = await characterService.createCharacter({
        ...formData,
        user_id: userId,
        level: 1,
        current_hp: 0, // Will be calculated by logic
        current_mp: 0
      });
      onComplete(character.id);
    } catch (error) {
      console.error('Error creating character:', error);
      alert('Erro ao criar personagem. Verifique se você está logado.');
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

  return (
    <div className="fixed inset-0 bg-gothic-bg z-50 overflow-y-auto gothic-scroll">
      <div className="max-w-4xl mx-auto p-8 py-16">
        <header className="text-center mb-16">
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
              <div className="flex justify-end">
                <button 
                  disabled={!formData.name}
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
                  className="flex items-center gap-2 px-8 py-3 bg-gothic-red text-white font-cinzel font-bold hover:bg-red-600 transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(139,0,0,0.4)]"
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
