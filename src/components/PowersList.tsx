import React, { useState, useEffect } from 'react';
import { compendiumService } from '../lib/compendium';
import type { Power } from '../types/database';
import { Search, Filter, Trophy, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface PowersListProps {
  onAddPower?: (power: Power) => void;
}

export function PowersList({ onAddPower }: PowersListProps) {
  const [powers, setPowers] = useState<Power[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const powerTypes = ['Geral', 'Classe', 'Raça', 'Origem', 'Concedido'];

  useEffect(() => {
    const loadPowers = async () => {
      try {
        const data = await compendiumService.getPowers();
        setPowers(data);
      } catch (error) {
        console.error('Error loading powers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPowers();
  }, []);

  const filteredPowers = powers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !activeFilter || p.power_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="p-8 text-center font-cinzel text-gothic-gold animate-pulse">Consultando o Compêndio de Poderes...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row gap-4 bg-gothic-card p-4 border border-gothic-gold/10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gothic-gold/40" size={18} />
          <input 
            type="text"
            placeholder="Buscar poder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-gothic-gold/20 pl-10 pr-4 py-2 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 gothic-scroll">
          {powerTypes.map(type => (
            <button
              key={type}
              onClick={() => setActiveFilter(activeFilter === type ? null : type)}
              className={cn(
                "px-3 md:px-4 py-2 font-cinzel text-[9px] md:text-[10px] font-bold tracking-widest uppercase border transition-all whitespace-nowrap",
                activeFilter === type 
                  ? "bg-gothic-gold text-gothic-bg border-gothic-gold" 
                  : "bg-gothic-card text-gothic-gold/60 border-gothic-gold/20 hover:border-gothic-gold/40"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredPowers.map(power => (
          <div key={power.id} className="bg-gothic-card p-4 md:p-6 border border-gothic-gold/10 hover:border-gothic-gold/30 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Trophy className="text-gothic-gold/40 group-hover:text-gothic-gold transition-colors" size={16} />
                <h4 className="font-cinzel text-xs md:text-sm font-bold text-gothic-gold">{power.name}</h4>
              </div>
              {onAddPower && (
                <button 
                  onClick={() => onAddPower(power)}
                  className="p-1 text-gothic-gold hover:bg-gothic-gold hover:text-gothic-bg transition-all border border-gothic-gold/20"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] md:text-xs text-gothic-text/60 leading-relaxed italic">
                {power.description}
              </p>
              
              {power.requirement_text && (
                <div className="pt-3 border-t border-gothic-gold/5">
                  <p className="text-[9px] md:text-[10px] font-bold text-gothic-red/60 uppercase tracking-widest mb-1">Pré-requisitos</p>
                  <p className="text-[9px] md:text-[10px] text-gothic-text/40">{power.requirement_text}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 bg-gothic-gold/5 text-gothic-gold/40 border border-gothic-gold/10 uppercase tracking-tighter">
                  {power.power_type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredPowers.length === 0 && (
        <div className="p-12 text-center bg-gothic-card/20 border border-dashed border-gothic-gold/10">
          <p className="font-cinzel text-gothic-text/40">Nenhum poder encontrado nas crônicas de Arthon.</p>
        </div>
      )}
    </div>
  );
}
