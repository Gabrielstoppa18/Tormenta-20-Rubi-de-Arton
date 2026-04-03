import React, { useState, useEffect } from 'react';
import { compendiumService } from '../lib/compendium';
import type { Race, Class, Origin, ClassPower } from '../types/database';
import { Shield, Sword, User, Book, Plus, ChevronRight, ChevronLeft, Sparkles, Trophy, Heart, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { CLASSES, RACES } from '../data/t20-data';

interface ClassDetailsProps {
  classId: string;
}

export function ClassDetails({ classId }: ClassDetailsProps) {
  const [cls, setCls] = useState<Class | null>(null);
  const [powers, setPowers] = useState<ClassPower[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClass = async () => {
      try {
        const [c, p] = await Promise.all([
          compendiumService.getClassById(classId),
          compendiumService.getClassPowers(classId)
        ]);
        
        if (c) {
          setCls(c);
        } else if (CLASSES[classId]) {
          const local = CLASSES[classId];
          setCls({
            id: classId,
            name: local.name,
            description: "Dados locais (Classe não encontrada no banco de dados)",
            hp_initial: local.initialPV,
            hp_per_level: local.pvPerLevel,
            mana_per_level: local.pmPerLevel,
            raw_data: local,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        setPowers(p);
      } catch (error) {
        console.error('Error loading class details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadClass();
  }, [classId]);

  if (loading) return <div className="p-8 text-center font-cinzel text-gothic-gold animate-pulse">Consultando os Arquivos da Classe...</div>;
  if (!cls) return <div className="p-8 text-center font-cinzel text-gothic-red">Classe não encontrada.</div>;

  return (
    <div className="space-y-8">
      <div className="bg-gothic-card p-8 border border-gothic-gold/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sword size={120} />
        </div>
        <div className="relative z-10">
          <h2 className="font-cinzel text-4xl font-bold text-gothic-gold mb-4 tracking-tighter uppercase">{cls.name}</h2>
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-gothic-red/10 border border-gothic-red/20 text-gothic-red">
              <Heart size={14} />
              <span className="text-xs font-bold font-cinzel">{cls.hp_initial} PV Iniciais (+{cls.hp_per_level}/nível)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-gothic-blue/10 border border-gothic-blue/20 text-gothic-blue">
              <Zap size={14} />
              <span className="text-xs font-bold font-cinzel">{cls.mana_per_level} PM por nível</span>
            </div>
          </div>
          <p className="text-sm text-gothic-text/60 leading-relaxed italic max-w-2xl">{cls.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <Trophy className="text-gothic-gold" size={20} />
          <h3 className="font-cinzel text-xl font-bold tracking-widest uppercase text-gothic-gold">Poderes de Classe</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {powers.map(cp => (
            <div key={cp.power_id} className="bg-gothic-card/40 p-6 border border-gothic-gold/10 hover:border-gothic-gold/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-cinzel text-sm font-bold text-gothic-gold">{cp.power?.name}</h4>
                <span className="text-[9px] px-1.5 py-0.5 bg-gothic-gold/5 text-gothic-gold/40 border border-gothic-gold/10 uppercase tracking-tighter">
                  Nível {cp.level_required}
                </span>
              </div>
              <p className="text-xs text-gothic-text/60 leading-relaxed">{cp.power?.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface RaceDetailsProps {
  raceId: string;
}

export function RaceDetails({ raceId }: RaceDetailsProps) {
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRace = async () => {
      try {
        const data = await compendiumService.getRaceById(raceId);
        if (data) {
          setRace(data);
        } else if (RACES[raceId]) {
          const local = RACES[raceId];
          setRace({
            id: raceId,
            name: local.name,
            description: "Dados locais (Raça não encontrada no banco de dados)",
            raw_data: local,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error loading race details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRace();
  }, [raceId]);

  if (loading) return <div className="p-8 text-center font-cinzel text-gothic-gold animate-pulse">Consultando as Linhagens de Arthon...</div>;
  if (!race) return <div className="p-8 text-center font-cinzel text-gothic-red">Raça não encontrada.</div>;

  return (
    <div className="bg-gothic-card p-8 border border-gothic-gold/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <User size={120} />
      </div>
      <div className="relative z-10">
        <h2 className="font-cinzel text-4xl font-bold text-gothic-gold mb-4 tracking-tighter uppercase">{race.name}</h2>
        <p className="text-sm text-gothic-text/60 leading-relaxed italic max-w-2xl mb-8">{race.description}</p>
        
        <div className="space-y-4">
          <h3 className="font-cinzel text-xs font-bold text-gothic-gold uppercase tracking-widest">Atributos e Habilidades</h3>
          <div className="bg-black/40 p-4 border border-gothic-gold/10">
            <pre className="text-[10px] text-gothic-text/40 font-mono whitespace-pre-wrap">
              {JSON.stringify(race.raw_data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

interface OriginDetailsProps {
  originId: string;
}

export function OriginDetails({ originId }: OriginDetailsProps) {
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrigin = async () => {
      try {
        const data = await compendiumService.getOriginById(originId);
        setOrigin(data);
      } catch (error) {
        console.error('Error loading origin details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOrigin();
  }, [originId]);

  if (loading) return <div className="p-8 text-center font-cinzel text-gothic-gold animate-pulse">Consultando as Origens de Arthon...</div>;
  if (!origin) return <div className="p-8 text-center font-cinzel text-gothic-red">Origem não encontrada.</div>;

  return (
    <div className="bg-gothic-card p-8 border border-gothic-gold/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Book size={120} />
      </div>
      <div className="relative z-10">
        <h2 className="font-cinzel text-4xl font-bold text-gothic-gold mb-4 tracking-tighter uppercase">{origin.name}</h2>
        <p className="text-sm text-gothic-text/60 leading-relaxed italic max-w-2xl mb-8">{origin.description}</p>
        
        <div className="space-y-4">
          <h3 className="font-cinzel text-xs font-bold text-gothic-gold uppercase tracking-widest">Benefícios da Origem</h3>
          <div className="bg-black/40 p-4 border border-gothic-gold/10">
            <pre className="text-[10px] text-gothic-text/40 font-mono whitespace-pre-wrap">
              {JSON.stringify(origin.raw_data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
