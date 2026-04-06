import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Book, Sword, Shield, Plus, X, ChevronRight } from 'lucide-react';
import { compendiumService } from '../lib/compendium';
import { useCharacter } from '../context/CharacterContext';
import type { Power, ClassPower } from '../types/database';
import { cn } from '../lib/utils';
import { POWERS } from '../data/t20-data';

interface LevelUpChoiceProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function LevelUpChoice({ onComplete, onCancel }: LevelUpChoiceProps) {
  const { state, addPower } = useCharacter();
  const [availablePowers, setAvailablePowers] = useState<Power[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPower, setSelectedPower] = useState<Power | null>(null);
  const [tab, setTab] = useState<'class' | 'general'>('class');

  useEffect(() => {
    const loadPowers = async () => {
      setLoading(true);
      try {
        // Fetch class powers
        const classPowers = await compendiumService.getClassPowers(state.class);
        
        // Filter by level (if applicable, though in T20 many are just "level 2+")
        // For now, just show all class powers that aren't already taken
        const classPowerList = classPowers
          .map(cp => cp.power)
          .filter((p): p is Power => !!p && !state.powers.some(sp => sp.name === p.name));

        // Fetch general powers
        const generalPowers = await compendiumService.getPowers('Geral');
        const generalPowerList = generalPowers.filter(p => !state.powers.some(sp => sp.name === p.name));

        // Fallback to local data if DB is empty
        if (generalPowerList.length === 0) {
          const localPowers = POWERS.filter(p => !state.powers.some(sp => sp.name === p.name)).map(p => ({
            id: p.name,
            name: p.name,
            description: p.description,
            power_type: 'Geral',
            requirement_text: p.requirements.join(', '),
            raw_data: p,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          setAvailablePowers([...classPowerList, ...localPowers]);
        } else {
          setAvailablePowers([...classPowerList, ...generalPowerList]);
        }
      } catch (error) {
        console.error('Error loading level up powers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPowers();
  }, [state.class, state.powers]);

  const handleConfirm = () => {
    if (!selectedPower) return;
    
    addPower({
      id: selectedPower.id,
      name: selectedPower.name,
      description: selectedPower.description || '',
      requirements: selectedPower.requirement_text ? [selectedPower.requirement_text] : []
    });
    
    onComplete();
  };

  const filteredPowers = availablePowers.filter(p => 
    tab === 'class' ? p.power_type !== 'Geral' : p.power_type === 'Geral'
  );

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
            <p className="text-gothic-text/40 text-[10px] uppercase tracking-widest mt-1">Escolha um novo poder para sua jornada</p>
          </div>
          <button onClick={onCancel} className="text-gothic-text/40 hover:text-gothic-red transition-colors">
            <X size={24} />
          </button>
        </header>

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

        <footer className="p-6 border-t border-gothic-gold/20 bg-black/40 flex justify-between items-center">
          <div className="max-w-[60%]">
            {selectedPower ? (
              <div className="animate-in fade-in slide-in-from-left-2">
                <p className="text-[10px] text-gothic-gold uppercase tracking-widest font-bold">Selecionado:</p>
                <p className="font-cinzel text-sm text-gothic-text truncate">{selectedPower.name}</p>
              </div>
            ) : (
              <p className="text-[10px] text-gothic-text/30 uppercase tracking-widest">Selecione um poder para continuar</p>
            )}
          </div>
          <button
            disabled={!selectedPower}
            onClick={handleConfirm}
            className="px-10 py-3 bg-gothic-gold text-gothic-bg font-cinzel font-bold tracking-widest hover:bg-white transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center gap-2"
          >
            CONFIRMAR ESCOLHA <ChevronRight size={18} />
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
