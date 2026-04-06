/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Sword, 
  Book, 
  Backpack, 
  User, 
  Menu, 
  Dices, 
  Heart, 
  Zap,
  Flame,
  Hand,
  Plus,
  Minus,
  Star,
  Trophy,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Settings,
  PlusCircle,
  Trash2,
  Sparkles,
  Skull,
  ZapOff,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useCharacter, T20InventoryItem } from './context/CharacterContext';
import { CLASSES, RACES, POWERS, SPELLS, DEITIES, ITEMS, SKILLS_ATTRIBUTES } from './data/t20-data';
import { calculateSkill } from './lib/t20-logic';
import { CharacterCreation } from './components/CharacterCreation';
import { PowersList } from './components/PowersList';
import { ClassDetails, RaceDetails, OriginDetails } from './components/CompendiumDetails';
import { LevelUpChoice } from './components/LevelUpChoice';
import { Auth } from './components/Auth';
import Rules from './components/Rules';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { characterService } from './lib/character';
import { compendiumService } from './lib/compendium';
import { userService } from './lib/user';
import type { Race, Class, Origin } from './types/database';

// --- Components ---

const Attribute = ({ label, value, onUpdate }: { label: string; value: number; onUpdate: (val: number) => void }) => (
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
        <span className="text-[10px] font-bold text-gothic-gold mt-0.5 uppercase">
          Mod
        </span>
      </div>
    </div>
    <span className="mt-4 text-[10px] font-bold tracking-widest uppercase text-gothic-text/60 group-hover:text-gothic-gold transition-colors">
      {label}
    </span>
  </div>
);

const SpellItem = ({ name, desc, cost, icon }: { key?: React.Key; name: string; desc: string; cost: number; icon: React.ReactNode }) => (
  <div className="group cursor-pointer">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <div className="text-gothic-gold/60 group-hover:text-gothic-gold transition-colors">
          {icon}
        </div>
        <h5 className="font-cinzel text-sm font-bold group-hover:text-gothic-gold transition-colors text-gothic-text">{name}</h5>
      </div>
      <span className="text-[10px] font-bold text-gothic-blue bg-gothic-blue/10 px-1.5 py-0.5 border border-gothic-blue/20">
        {cost} PM
      </span>
    </div>
    <p className="text-xs text-gothic-text/50 italic leading-relaxed pl-7">{desc}</p>
  </div>
);

const InventoryItem = ({ item, onUpdate, onRemove }: { item: T20InventoryItem; onUpdate: (updates: Partial<T20InventoryItem>) => void; onRemove: () => void; key?: React.Key }) => {
  const [isEditing, setIsEditing] = useState(false);

  const getIcon = () => {
    const lowerType = item.type.toLowerCase();
    if (lowerType.includes('arma')) return <Sword size={14} className="text-gothic-gold/60" />;
    if (lowerType.includes('armadura') || lowerType.includes('escudo')) return <Shield size={14} className="text-gothic-gold/60" />;
    return <Backpack size={14} className="text-gothic-gold/60" />;
  };

  return (
    <div className="flex flex-col p-4 bg-gothic-card/40 border border-gothic-gold/10 hover:border-gothic-gold/30 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-gothic-bg border border-gothic-gold/10">
            {getIcon()}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <input 
                value={item.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full bg-black/40 border border-gothic-gold/20 p-1 font-cinzel text-xs text-gothic-text outline-none"
                autoFocus
              />
            ) : (
              <h5 className="font-cinzel text-xs font-bold text-gothic-text group-hover:text-gothic-gold transition-colors">{item.name}</h5>
            )}
            <p className="text-[9px] text-gothic-text/40 uppercase tracking-tighter">{item.type} • {item.weight}kg • {item.cost}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="text-gothic-gold/40 hover:text-gothic-gold transition-colors"
          >
            <Settings size={12} />
          </button>
          <button onClick={onRemove} className="text-gothic-red/40 hover:text-gothic-red transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-gothic-gold/40 uppercase tracking-widest">Quantidade</span>
          <div className="flex items-center bg-black/40 border border-gothic-gold/10 p-0.5">
            <button 
              onClick={() => onUpdate({ quantity: Math.max(0, item.quantity - 1) })}
              className="p-1 text-gothic-gold/60 hover:text-gothic-gold"
            >
              <Minus size={10} />
            </button>
            <input 
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 0 })}
              className="w-8 bg-transparent text-center text-xs font-bold font-cinzel text-gothic-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button 
              onClick={() => onUpdate({ quantity: item.quantity + 1 })}
              className="p-1 text-gothic-gold/60 hover:text-gothic-gold"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-bold text-gothic-gold/40 uppercase tracking-widest">Descrição / Notas</span>
          <textarea 
            value={item.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Adicione notas sobre o item..."
            className="w-full bg-black/40 border border-gothic-gold/10 p-2 text-[10px] text-gothic-text/60 outline-none focus:border-gothic-gold/30 min-h-[40px] resize-none"
          />
        </div>
      </div>
    </div>
  );
};

const SkillRow = ({ name, bonus, onClick }: { key?: React.Key; name: string; bonus: number; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between p-2 bg-gothic-card/20 border-b border-gothic-gold/5 hover:bg-gothic-card/40 transition-colors group cursor-pointer"
  >
    <span className="font-cinzel text-[10px] font-bold tracking-widest uppercase text-gothic-text/60 group-hover:text-gothic-gold transition-colors">{name}</span>
    <span className="font-cinzel text-sm font-bold text-gothic-gold">{bonus >= 0 ? `+${bonus}` : bonus}</span>
  </div>
);

// --- VFX System ---

type VFXType = 'level-up' | 'crit-hit' | 'crit-fail' | 'attack' | 'spell' | 'skill';

const SOUNDS = {
  'level-up': 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  'crit-hit': 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  'crit-fail': 'https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3',
  'attack': 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  'spell': 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  'skill': 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
};

const playSound = (type: VFXType) => {
  const audio = new Audio(SOUNDS[type]);
  audio.volume = 0.4;
  audio.play().catch(() => {}); // Ignore autoplay blocks
};

const VFXOverlay = ({ type, onComplete }: { type: VFXType; onComplete: () => void }) => {
  useEffect(() => {
    playSound(type);
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [type, onComplete]);

  const variants = {
    'level-up': (
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.5 }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      >
        <div className="absolute inset-0 bg-gothic-gold/10 backdrop-blur-[2px]" />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute w-[600px] h-[600px] border border-gothic-gold/20 rounded-full"
        />
        <div className="relative flex flex-col items-center">
          <motion.div
            animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-gothic-gold mb-4"
          >
            <Sparkles size={80} />
          </motion.div>
          <h2 className="font-cinzel text-6xl font-bold text-gothic-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]">NÍVEL UP!</h2>
        </div>
      </motion.div>
    ),
    'crit-hit': (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-gothic-red/20"
      >
        <motion.div
          animate={{ scale: [1, 1.5, 1], rotate: [-5, 5, -5] }}
          transition={{ duration: 0.2, repeat: 5 }}
          className="flex flex-col items-center"
        >
          <Skull size={120} className="text-gothic-red drop-shadow-[0_0_30px_#8B0000]" />
          <h2 className="font-medieval text-8xl text-gothic-red mt-4 drop-shadow-[0_0_20px_#000]">CRÍTICO!</h2>
        </motion.div>
      </motion.div>
    ),
    'crit-fail': (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-black/60"
      >
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.5, repeat: 3 }}
          className="flex flex-col items-center"
        >
          <ZapOff size={100} className="text-gray-600" />
          <h2 className="font-cinzel text-5xl text-gray-400 mt-4 tracking-[0.5em]">FALHA CRÍTICA</h2>
        </motion.div>
      </motion.div>
    ),
    'attack': (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      >
        <motion.div
          initial={{ x: -200, opacity: 0, rotate: -45 }}
          animate={{ x: 200, opacity: [0, 1, 0], rotate: 45 }}
          transition={{ duration: 0.4 }}
          className="w-1 h-[400px] bg-white shadow-[0_0_20px_#fff]"
        />
      </motion.div>
    ),
    'spell': (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: [0, 1.2, 1], rotate: 180 }}
          exit={{ scale: 2, opacity: 0 }}
          className="w-64 h-64 border-4 border-double border-gothic-blue rounded-full flex items-center justify-center"
        >
          <div className="w-48 h-48 border border-gothic-blue/40 rounded-full animate-pulse" />
          <div className="absolute text-gothic-blue">
            <Zap size={60} />
          </div>
        </motion.div>
      </motion.div>
    ),
    'skill': null,
  };

  return variants[type];
};

export default function App() {
  const { 
    state, 
    modifiers, 
    maxPV, 
    maxPM, 
    defesa,
    setName,
    setRace,
    setClass,
    setDeity,
    setAttribute,
    setDefenseBonus,
    takeDamage,
    spendPM,
    addPower,
    removePower,
    addSpell,
    removeSpell,
    addItem,
    updateItem,
    removeItem,
    levelUp,
    levelDown,
    saveCharacter,
    loadCharacter,
    unloadCharacter
  } = useCharacter();

  const [activeTab, setActiveTab] = useState<'geral' | 'combate' | 'pericias' | 'inventario' | 'grimorio' | 'compendio' | 'regras'>('geral');
  const [compendioTab, setCompendioTab] = useState<'classes' | 'races' | 'origins' | 'powers'>('powers');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  const [rollData, setRollData] = useState<{ result: number; bonus: number; isCritical: boolean; isFail: boolean } | null>(null);
  const [showAddPower, setShowAddPower] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddSpell, setShowAddSpell] = useState(false);
  const [activeVFX, setActiveVFX] = useState<VFXType | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);
  const [showCreation, setShowCreation] = useState(false);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  // Compendium lists from DB
  const [dbClasses, setDbClasses] = useState<Class[]>([]);
  const [dbRaces, setDbRaces] = useState<Race[]>([]);
  const [dbOrigins, setDbOrigins] = useState<Origin[]>([]);
  const [loadingCompendium, setLoadingCompendium] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        userService.syncProfile(firebaseUser);
      } else {
        unloadCharacter();
      }
    });

    return () => unsubscribe();
  }, [unloadCharacter]);

  useEffect(() => {
    if (user) {
      loadUserCharacters();
    } else {
      setCharacters([]);
      setCurrentCharacterId(null);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'compendio') {
      loadCompendiumLists();
    }
  }, [activeTab]);

  const loadCompendiumLists = async () => {
    setLoadingCompendium(true);
    try {
      const [c, r, o] = await Promise.all([
        compendiumService.getClasses(),
        compendiumService.getRaces(),
        compendiumService.getOrigins()
      ]);
      setDbClasses(c);
      setDbRaces(r);
      setDbOrigins(o);
    } catch (error) {
      console.error('Error loading compendium lists:', error);
    } finally {
      setLoadingCompendium(false);
    }
  };

  const loadUserCharacters = async () => {
    if (!user) return;
    setLoadingCharacters(true);
    try {
      const data = await characterService.getCharacters(user.uid);
      setCharacters(data);
      if (data.length > 0 && !currentCharacterId) {
        // Auto-select first character for demo
        // In a real app, we might want a selection screen
      }
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setLoadingCharacters(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  const selectCharacter = async (id: string) => {
    setCurrentCharacterId(id);
    await loadCharacter(id);
  };

  const triggerVFX = (type: VFXType) => {
    setActiveVFX(null);
    setTimeout(() => setActiveVFX(type), 10);
  };

  const handleRoll = (bonus: number, type: VFXType = 'skill') => {
    const natural = Math.floor(Math.random() * 20) + 1;
    const isCritical = natural === 20;
    const isFail = natural === 1;

    setRollData({
      result: natural + bonus,
      bonus: bonus,
      isCritical,
      isFail
    });

    if (isCritical) triggerVFX('crit-hit');
    else if (isFail) triggerVFX('crit-fail');
    else triggerVFX(type);

    setTimeout(() => setRollData(null), 4000);
  };

  const handleLevelUp = () => {
    levelUp();
    triggerVFX('level-up');
    setShowLevelUpModal(true);
  };

  const handleSeedCompendium = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      await compendiumService.seedCompendium();
      alert('Compêndio sincronizado com sucesso!');
      loadCompendiumLists();
    } catch (error) {
      console.error('Error seeding compendium:', error);
      alert('Erro ao sincronizar compêndio.');
    } finally {
      setIsSeeding(false);
    }
  };

  const tabs = [
    { id: 'geral', label: 'Geral', icon: <User size={18} /> },
    { id: 'combate', label: 'Combate', icon: <Sword size={18} /> },
    { id: 'pericias', label: 'Perícias', icon: <Star size={18} /> },
    { id: 'inventario', label: 'Inventário', icon: <Backpack size={18} /> },
    { id: 'grimorio', label: 'Grimório', icon: <Book size={18} /> },
    { id: 'compendio', label: 'Compêndio', icon: <Book size={18} /> },
    { id: 'regras', label: 'Regras', icon: <Book size={18} /> },
  ] as const;

  if (!user) {
    return <Auth onSuccess={setUser} />;
  }

  if (showCreation) {
    return <CharacterCreation 
      userId={user.uid} 
      onComplete={(id) => {
        setCurrentCharacterId(id);
        setShowCreation(false);
        loadUserCharacters();
        loadCharacter(id);
      }} 
      onCancel={() => setShowCreation(false)}
    />;
  }

  if (!state.isLoaded) {
    return (
      <div className="flex h-screen bg-gothic-bg items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <header>
            <h1 className="font-cinzel text-4xl font-bold text-gothic-gold mb-2 tracking-tighter">
              TORMENTA <span className="text-gothic-red">20</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-gothic-text/30">Arthon Gothic Edition</p>
          </header>

          <div className="bg-gothic-card border border-gothic-gold/20 p-8 space-y-6">
            <h2 className="font-cinzel text-xl text-gothic-gold uppercase tracking-widest">Seus Personagens</h2>
            
            {loadingCharacters ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-gothic-gold/20 border-t-gothic-gold rounded-full animate-spin" />
                <p className="font-cinzel text-[10px] text-gothic-gold/40 uppercase tracking-widest">Consultando os arquivos...</p>
              </div>
            ) : characters.length === 0 ? (
              <div className="py-8 space-y-4">
                <p className="text-gothic-text/40 text-sm italic">Você ainda não possui fichas em Arthon.</p>
                <button 
                  onClick={() => setShowCreation(true)}
                  className="w-full py-4 bg-gothic-gold text-gothic-bg font-cinzel font-bold hover:bg-white transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <PlusCircle size={18} /> Criar Primeira Ficha
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto gothic-scroll pr-2">
                {characters.map(char => (
                  <button
                    key={char.id}
                    onClick={() => selectCharacter(char.id)}
                    className="w-full p-4 bg-black/40 border border-gothic-gold/10 hover:border-gothic-gold/40 text-left group transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-cinzel text-gothic-gold group-hover:tracking-widest transition-all">{char.name}</h3>
                        <p className="text-[9px] text-gothic-text/40 uppercase tracking-widest">
                          {RACES[char.race_id]?.name || char.race_id} {CLASSES[char.class_id]?.name || char.class_id} • Nível {char.level}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gothic-gold/20 group-hover:text-gothic-gold transition-colors" />
                    </div>
                  </button>
                ))}
                <button 
                  onClick={() => setShowCreation(true)}
                  className="w-full py-3 border border-dashed border-gothic-gold/20 text-gothic-gold/40 hover:border-gothic-gold hover:text-gothic-gold transition-all font-cinzel text-[10px] uppercase tracking-widest"
                >
                  + Nova Ficha
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={handleLogout}
            className="text-gothic-red/40 hover:text-gothic-red transition-colors font-cinzel text-[10px] uppercase tracking-widest"
          >
            Sair de Arthon
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gothic-bg overflow-hidden selection:bg-gothic-gold/30">
      {/* --- Sidebar --- */}
      <aside className="w-64 bg-black border-r border-gothic-gold/10 flex flex-col z-20">
        <div className="p-8">
          <h1 className="font-cinzel text-2xl font-bold text-gothic-gold leading-tight tracking-tighter">
            TORMENTA <span className="text-gothic-red">20</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.3em] text-gothic-text/30 mt-1">
            Arthon Gothic Edition
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto gothic-scroll">
          <div className="mb-6">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-[9px] font-bold text-gothic-gold/40 uppercase tracking-widest">Personagens</span>
              <button 
                onClick={() => setShowCreation(true)}
                className="text-gothic-gold hover:text-white transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            {loadingCharacters ? (
              <div className="px-4 py-2 text-[10px] text-gothic-text/20 animate-pulse">Carregando...</div>
            ) : characters.length === 0 ? (
              <div className="px-4 py-2 text-[10px] text-gothic-text/20 italic">Nenhum personagem</div>
            ) : (
              characters.map(char => (
                <button
                  key={char.id}
                  onClick={() => selectCharacter(char.id)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-xs font-cinzel transition-all",
                    currentCharacterId === char.id ? "text-gothic-gold bg-gothic-gold/5" : "text-gothic-text/40 hover:text-gothic-gold/60"
                  )}
                >
                  <div className="flex flex-col">
                    <span>{char.name}</span>
                    <span className="text-[8px] opacity-50 uppercase tracking-tighter">
                      {RACES[char.race_id]?.name || char.race_id} {CLASSES[char.class_id]?.name || char.class_id}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="h-px bg-gothic-gold/10 mx-4 mb-4" />

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 font-cinzel text-sm tracking-widest uppercase transition-all duration-300",
                activeTab === tab.id 
                  ? "bg-gothic-card text-gothic-red border-l-2 border-gothic-red" 
                  : "text-gothic-text/40 hover:text-gothic-gold hover:bg-gothic-card/30"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gothic-gold/5 bg-gothic-card/20 space-y-4">
          {user?.email === 'gabrielstoppa@gmail.com' && (
            <button 
              onClick={handleSeedCompendium}
              disabled={isSeeding}
              className="w-full py-2 border border-gothic-gold/20 text-[9px] font-bold text-gothic-gold/60 hover:bg-gothic-gold/10 hover:text-gothic-gold transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {isSeeding ? 'Sincronizando...' : 'Sincronizar Compêndio'}
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm border border-gothic-gold/30 p-0.5">
              <img 
                src={`https://picsum.photos/seed/${state.name}/100/100`} 
                alt="Avatar" 
                className="w-full h-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-cinzel text-xs font-bold text-gothic-text truncate">{state.name}</p>
              <p className="text-[10px] text-gothic-gold/60 italic truncate">
                {RACES[state.race]?.name || state.race} {CLASSES[state.class]?.name || state.class}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={unloadCharacter}
              className="py-2 border border-gothic-gold/20 text-[9px] font-bold text-gothic-gold/60 hover:bg-gothic-gold/10 hover:text-gothic-gold transition-all uppercase tracking-widest"
            >
              Trocar Ficha
            </button>
            <button 
              onClick={handleLogout}
              className="py-2 border border-gothic-red/20 text-[9px] font-bold text-gothic-red/60 hover:bg-gothic-red/10 hover:text-gothic-red transition-all uppercase tracking-widest"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-y-auto gothic-scroll relative">
        <header className="sticky top-0 z-10 bg-gothic-bg/80 backdrop-blur-md border-b border-gothic-gold/5 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Menu className="text-gothic-gold cursor-pointer hover:scale-110 transition-transform" />
            <h2 className="font-cinzel text-lg tracking-[0.2em] text-gothic-gold/80 uppercase">Painel do Personagem</h2>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={saveCharacter}
              className="flex items-center gap-2 px-3 py-1.5 border border-gothic-gold/30 text-gothic-gold hover:bg-gothic-gold hover:text-gothic-bg transition-all font-cinzel text-[10px] font-bold uppercase tracking-widest"
            >
              Salvar
            </button>
            <div className="flex items-center bg-gothic-card/50 border border-gothic-gold/20 p-1">
              <button 
                onClick={levelDown}
                className="p-1.5 text-gothic-gold hover:bg-gothic-gold hover:text-gothic-bg transition-all"
                title="Level Down"
              >
                <ChevronDown size={14} />
              </button>
              <div className="px-3 font-cinzel text-xs font-bold text-gothic-gold border-x border-gothic-gold/20">
                NÍVEL {state.level}
              </div>
              <button 
                onClick={handleLevelUp}
                className="p-1.5 text-gothic-gold hover:bg-gothic-gold hover:text-gothic-bg transition-all"
                title="Level Up"
              >
                <ChevronUp size={14} />
              </button>
            </div>
            <Dices 
              className="text-gothic-gold cursor-pointer hover:rotate-45 transition-transform" 
              onClick={() => handleRoll(0)}
            />
          </div>
        </header>

        <AnimatePresence>
          {activeVFX && <VFXOverlay type={activeVFX} onComplete={() => setActiveVFX(null)} />}
        </AnimatePresence>

        <div className="p-8 max-w-6xl mx-auto space-y-8">
          {activeTab === 'geral' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Basic Info */}
              <section className="bg-gothic-card p-8 border border-gothic-gold/10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                      {Object.entries(RACES).map(([id, r]) => <option key={id} value={id} className="bg-gothic-card">{r.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Classe</label>
                    <select 
                      value={state.class} 
                      onChange={(e) => setClass(e.target.value)}
                      className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
                    >
                      {Object.entries(CLASSES).map(([id, c]) => <option key={id} value={id} className="bg-gothic-card">{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Divindade</label>
                    <select 
                      value={state.deity} 
                      onChange={(e) => setDeity(e.target.value)}
                      className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
                    >
                      {Object.entries(DEITIES).map(([id, d]) => <option key={id} value={id} className="bg-gothic-card">{d.name}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Attributes Grid */}
              <section className="bg-gothic-card/30 p-8 border border-gothic-gold/5">
                <div className="flex items-center gap-4 mb-8">
                  <Settings className="text-gothic-gold" size={20} />
                  <h3 className="font-cinzel text-xl font-bold tracking-widest uppercase text-gothic-gold">Atributos (JdA)</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                  <Attribute label="FOR" value={state.attributes.for} onUpdate={(v) => setAttribute('for', v)} />
                  <Attribute label="DES" value={state.attributes.des} onUpdate={(v) => setAttribute('des', v)} />
                  <Attribute label="CON" value={state.attributes.con} onUpdate={(v) => setAttribute('con', v)} />
                  <Attribute label="INT" value={state.attributes.int} onUpdate={(v) => setAttribute('int', v)} />
                  <Attribute label="SAB" value={state.attributes.sab} onUpdate={(v) => setAttribute('sab', v)} />
                  <Attribute label="CAR" value={state.attributes.car} onUpdate={(v) => setAttribute('car', v)} />
                </div>
              </section>

              {/* Powers Management */}
              <section className="bg-gothic-card p-8 border border-gothic-gold/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Trophy className="text-gothic-gold" size={20} />
                    <h3 className="font-cinzel text-xl font-bold tracking-widest uppercase text-gothic-gold">Poderes e Habilidades</h3>
                  </div>
                  <button 
                    onClick={() => setShowAddPower(!showAddPower)}
                    className="flex items-center gap-2 text-xs font-bold text-gothic-gold hover:text-white transition-colors"
                  >
                    <PlusCircle size={16} />
                    ADICIONAR PODER
                  </button>
                </div>

                {showAddPower && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-4 bg-black/40 border border-gothic-gold/20">
                    {POWERS.filter(p => !state.powers.find(sp => sp.name === p.name)).map(power => (
                      <div key={power.name} className="p-3 border border-gothic-gold/10 hover:border-gothic-gold/40 transition-colors">
                        <div className="flex justify-between items-start">
                          <h5 className="font-cinzel text-xs font-bold text-gothic-text">{power.name}</h5>
                          <button onClick={() => addPower(power)} className="text-gothic-gold hover:text-white"><Plus size={14}/></button>
                        </div>
                        <p className="text-[10px] text-gothic-text/40 mt-1 line-clamp-2">{power.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.powers.map((power) => (
                    <div key={power.id || power.name} className="p-4 bg-gothic-card/40 border border-gothic-gold/10 relative group">
                      <button 
                        onClick={() => removePower(power.id || power.name)}
                        className="absolute top-2 right-2 text-gothic-red/40 hover:text-gothic-red opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                      <h5 className="font-cinzel text-sm font-bold text-gothic-gold">{power.name}</h5>
                      <p className="text-[11px] text-gothic-text/60 mt-2 leading-relaxed">{power.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {power.requirements.map(req => (
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
          )}

          {activeTab === 'combate' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Bars */}
                <div className="lg:col-span-2 bg-gothic-card p-8 border border-gothic-gold/10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* PV Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2 text-gothic-red">
                          <Heart size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Vida (PV)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => takeDamage(1)} className="text-gothic-red/60 hover:text-gothic-red"><Minus size={12}/></button>
                          <span className="font-cinzel text-lg text-gothic-text">{state.currentPV} / {maxPV}</span>
                          <button onClick={() => takeDamage(-1)} className="text-gothic-red/60 hover:text-gothic-red"><Plus size={12}/></button>
                        </div>
                      </div>
                      <div className="h-4 bg-black border border-gothic-gold/20 p-0.5">
                        <motion.div 
                          initial={false}
                          animate={{ width: `${Math.max(0, (state.currentPV / maxPV) * 100)}%` }}
                          className="h-full bg-gradient-to-r from-gothic-red to-red-900 shadow-[0_0_10px_rgba(139,0,0,0.5)]"
                        />
                      </div>
                    </div>

                    {/* PM Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2 text-gothic-blue">
                          <Zap size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Mana (PM)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => spendPM(1)} className="text-gothic-blue/60 hover:text-gothic-blue"><Minus size={12}/></button>
                          <span className="font-cinzel text-lg text-gothic-text">{state.currentPM} / {maxPM}</span>
                          <button onClick={() => spendPM(-1)} className="text-gothic-blue/60 hover:text-gothic-blue"><Plus size={12}/></button>
                        </div>
                      </div>
                      <div className="h-4 bg-black border border-gothic-gold/20 p-0.5">
                        <motion.div 
                          initial={false}
                          animate={{ width: `${Math.max(0, (state.currentPM / maxPM) * 100)}%` }}
                          className="h-full bg-gradient-to-r from-gothic-blue to-blue-900 shadow-[0_0_10px_rgba(26,58,90,0.5)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Attacks */}
                  <div className="space-y-4">
                    <h4 className="font-cinzel text-xs font-bold text-gothic-gold uppercase tracking-widest">Ataques</h4>
                    <div className="space-y-2">
                      {state.inventory.map(itemName => {
                        const item = ITEMS[itemName];
                        if (item?.type !== 'Arma') return null;
                        const bonus = calculateSkill(state.level, modifiers.for, true); // Assuming Luta for now
                        return (
                          <div key={itemName} className="flex items-center justify-between p-4 bg-black/40 border border-gothic-gold/10 group hover:border-gothic-gold/40 transition-colors">
                            <div className="flex items-center gap-4">
                              <Sword size={16} className="text-gothic-gold/60" />
                              <div>
                                <h5 className="font-cinzel text-sm font-bold text-gothic-text">{item.name}</h5>
                                <p className="text-[10px] text-gothic-text/40 uppercase tracking-tighter">Dano: {item.damage}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleRoll(bonus, 'attack')}
                              className="px-6 py-2 bg-gothic-gold/10 border border-gothic-gold/30 text-gothic-gold font-cinzel text-xs font-bold hover:bg-gothic-gold hover:text-gothic-bg transition-all"
                            >
                              ATACAR (+{bonus})
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Defense & Stats */}
                <div className="bg-gothic-card p-8 border border-gothic-gold/10 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <Shield size={100} className="text-gothic-gold/10 fill-gothic-gold/5" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                      <span className="text-[9px] font-bold text-gothic-gold/60 uppercase tracking-[0.2em] mb-1">Defesa</span>
                      <p className="font-cinzel text-4xl font-bold text-gothic-gold leading-none">{defesa}</p>
                    </div>
                  </div>
                  <div className="w-full pt-6 border-t border-gothic-gold/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gothic-text/40 uppercase tracking-widest">Bônus Manual</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setDefenseBonus(state.defenseBonus - 1)} className="text-gothic-gold/60 hover:text-gothic-gold transition-colors">
                          <Minus size={14}/>
                        </button>
                        <span className="font-cinzel text-sm font-bold text-gothic-gold">{state.defenseBonus}</span>
                        <button onClick={() => setDefenseBonus(state.defenseBonus + 1)} className="text-gothic-gold/60 hover:text-gothic-gold transition-colors">
                          <Plus size={14}/>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pericias' && (
            <section className="bg-gothic-card p-8 border border-gothic-gold/10 animate-in fade-in duration-500">
              <div className="flex items-center gap-4 mb-8">
                <Star className="text-gothic-gold" size={20} />
                <h3 className="font-cinzel text-xl font-bold tracking-widest uppercase text-gothic-gold">Lista de Perícias</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-2">
                {Object.keys(SKILLS_ATTRIBUTES).sort().map((skillName) => {
                  const isTrained = CLASSES[state.class]?.trainedSkills.includes(skillName);
                  const attrKey = SKILLS_ATTRIBUTES[skillName] as keyof typeof modifiers;
                  const bonus = calculateSkill(state.level, modifiers[attrKey] || 0, isTrained);
                  return (
                    <div key={skillName} className={cn(
                      "flex items-center justify-between p-2 border-b border-gothic-gold/5 transition-colors group cursor-pointer",
                      isTrained ? "bg-gothic-gold/5" : "hover:bg-gothic-card/40"
                    )} onClick={() => handleRoll(bonus, 'skill')}>
                      <div className="flex items-center gap-2">
                        {isTrained && <Trophy size={10} className="text-gothic-gold" />}
                        <span className={cn(
                          "font-cinzel text-[10px] font-bold tracking-widest uppercase transition-colors",
                          isTrained ? "text-gothic-gold" : "text-gothic-text/60 group-hover:text-gothic-gold"
                        )}>{skillName}</span>
                      </div>
                      <span className="font-cinzel text-sm font-bold text-gothic-gold">{bonus >= 0 ? `+${bonus}` : bonus}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'inventario' && (
            <section className="bg-gothic-card p-8 border border-gothic-gold/10 animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <Backpack className="text-gothic-gold" size={20} />
                  <h3 className="font-cinzel text-xl font-bold tracking-widest uppercase text-gothic-gold">Mochila de Itens</h3>
                </div>
                <button 
                  onClick={() => setShowAddItem(!showAddItem)}
                  className="flex items-center gap-2 text-xs font-bold text-gothic-gold hover:text-white transition-colors"
                >
                  <PlusCircle size={16} />
                  ADICIONAR ITEM
                </button>
              </div>

              {showAddItem && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-4 bg-black/40 border border-gothic-gold/20">
                  {Object.values(ITEMS).map(item => (
                    <div key={item.name} className="p-3 border border-gothic-gold/10 hover:border-gothic-gold/40 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-cinzel text-xs font-bold text-gothic-text">{item.name}</h5>
                          <p className="text-[8px] text-gothic-text/40 uppercase">{item.type}</p>
                        </div>
                        <button onClick={() => addItem(item.name)} className="text-gothic-gold hover:text-white"><Plus size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.inventory.map((item) => (
                  <InventoryItem 
                    key={item.id}
                    item={item}
                    onUpdate={(updates) => updateItem(item.id, updates)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'grimorio' && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-4 bg-black/40 border border-gothic-gold/20">
                  {SPELLS.filter(s => !state.spells.find(ss => ss.name === s.name)).map(spell => (
                    <div key={spell.name} className="p-3 border border-gothic-gold/10 hover:border-gothic-gold/40 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-cinzel text-xs font-bold text-gothic-text">{spell.name}</h5>
                          <p className="text-[8px] text-gothic-text/40 uppercase">{spell.type} • {spell.circle}º Círculo</p>
                        </div>
                        <button onClick={() => {
                          addSpell(spell);
                          triggerVFX('spell');
                        }} className="text-gothic-gold hover:text-white"><Plus size={14}/></button>
                      </div>
                    </div>
                  ))}
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-gothic-gold/60">
                          {spell.type === 'Divina' ? <Hand size={16} /> : <Flame size={16} />}
                        </div>
                        <h5 className="font-cinzel text-sm font-bold text-gothic-text">{spell.name}</h5>
                      </div>
                      <span className="text-[10px] font-bold text-gothic-blue bg-gothic-blue/10 px-1.5 py-0.5 border border-gothic-blue/20">
                        {spell.circle} PM
                      </span>
                    </div>
                    <p className="text-xs text-gothic-text/50 italic leading-relaxed">{spell.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'compendio' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex gap-4 border-b border-gothic-gold/10 pb-4">
                {(['powers', 'classes', 'races', 'origins'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setCompendioTab(t); setSelectedEntityId(null); }}
                    className={cn(
                      "font-cinzel text-[10px] font-bold tracking-widest uppercase px-4 py-2 transition-all",
                      compendioTab === t ? "text-gothic-gold border-b-2 border-gothic-gold" : "text-gothic-text/40 hover:text-gothic-gold"
                    )}
                  >
                    {t === 'powers' ? 'Poderes' : t === 'classes' ? 'Classes' : t === 'races' ? 'Raças' : 'Origens'}
                  </button>
                ))}
              </div>

              {compendioTab === 'powers' && <PowersList />}
              
              {compendioTab === 'classes' && !selectedEntityId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loadingCompendium ? (
                    <div className="col-span-full text-center py-12 font-cinzel text-gothic-gold animate-pulse">Consultando Arquivos...</div>
                  ) : dbClasses.length > 0 ? (
                    dbClasses.map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => setSelectedEntityId(c.id)}
                        className="p-6 bg-gothic-card border border-gothic-gold/10 hover:border-gothic-gold/40 transition-all text-left group"
                      >
                        <h4 className="font-cinzel text-xl font-bold text-gothic-gold group-hover:tracking-widest transition-all">{c.name}</h4>
                        <p className="text-[10px] text-gothic-text/40 mt-2 uppercase tracking-widest">Ver Detalhes</p>
                      </button>
                    ))
                  ) : (
                    Object.keys(CLASSES).map(c => (
                      <button 
                        key={c} 
                        onClick={() => setSelectedEntityId(c)}
                        className="p-6 bg-gothic-card border border-gothic-gold/10 hover:border-gothic-gold/40 transition-all text-left group"
                      >
                        <h4 className="font-cinzel text-xl font-bold text-gothic-gold group-hover:tracking-widest transition-all">{c}</h4>
                        <p className="text-[10px] text-gothic-text/40 mt-2 uppercase tracking-widest">Ver Detalhes (Local)</p>
                      </button>
                    ))
                  )}
                </div>
              )}
              {compendioTab === 'classes' && selectedEntityId && (
                <div>
                  <button onClick={() => setSelectedEntityId(null)} className="mb-4 text-gothic-gold font-cinzel text-xs flex items-center gap-2">
                    <ChevronLeft size={14} /> VOLTAR PARA LISTA
                  </button>
                  <ClassDetails classId={selectedEntityId} />
                </div>
              )}

              {compendioTab === 'races' && !selectedEntityId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loadingCompendium ? (
                    <div className="col-span-full text-center py-12 font-cinzel text-gothic-gold animate-pulse">Consultando Arquivos...</div>
                  ) : dbRaces.length > 0 ? (
                    dbRaces.map(r => (
                      <button 
                        key={r.id} 
                        onClick={() => setSelectedEntityId(r.id)}
                        className="p-6 bg-gothic-card border border-gothic-gold/10 hover:border-gothic-gold/40 transition-all text-left group"
                      >
                        <h4 className="font-cinzel text-xl font-bold text-gothic-gold group-hover:tracking-widest transition-all">{r.name}</h4>
                        <p className="text-[10px] text-gothic-text/40 mt-2 uppercase tracking-widest">Ver Detalhes</p>
                      </button>
                    ))
                  ) : (
                    Object.keys(RACES).map(r => (
                      <button 
                        key={r} 
                        onClick={() => setSelectedEntityId(r)}
                        className="p-6 bg-gothic-card border border-gothic-gold/10 hover:border-gothic-gold/40 transition-all text-left group"
                      >
                        <h4 className="font-cinzel text-xl font-bold text-gothic-gold group-hover:tracking-widest transition-all">{r}</h4>
                        <p className="text-[10px] text-gothic-text/40 mt-2 uppercase tracking-widest">Ver Detalhes (Local)</p>
                      </button>
                    ))
                  )}
                </div>
              )}
              {compendioTab === 'races' && selectedEntityId && (
                <div>
                  <button onClick={() => setSelectedEntityId(null)} className="mb-4 text-gothic-gold font-cinzel text-xs flex items-center gap-2">
                    <ChevronLeft size={14} /> VOLTAR PARA LISTA
                  </button>
                  <RaceDetails raceId={selectedEntityId} />
                </div>
              )}

              {compendioTab === 'origins' && !selectedEntityId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loadingCompendium ? (
                    <div className="col-span-full text-center py-12 font-cinzel text-gothic-gold animate-pulse">Consultando Arquivos...</div>
                  ) : dbOrigins.length > 0 ? (
                    dbOrigins.map(o => (
                      <button 
                        key={o.id} 
                        onClick={() => setSelectedEntityId(o.id)}
                        className="p-6 bg-gothic-card border border-gothic-gold/10 hover:border-gothic-gold/40 transition-all text-left group"
                      >
                        <h4 className="font-cinzel text-xl font-bold text-gothic-gold group-hover:tracking-widest transition-all">{o.name}</h4>
                        <p className="text-[10px] text-gothic-text/40 mt-2 uppercase tracking-widest">Ver Detalhes</p>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center border border-dashed border-gothic-gold/20">
                      <p className="font-cinzel text-gothic-text/40">Nenhuma origem encontrada no banco de dados.</p>
                    </div>
                  )}
                </div>
              )}

              {compendioTab === 'origins' && selectedEntityId && (
                <div>
                  <button onClick={() => setSelectedEntityId(null)} className="mb-4 text-gothic-gold font-cinzel text-xs flex items-center gap-2">
                    <ChevronLeft size={14} /> VOLTAR PARA LISTA
                  </button>
                  <OriginDetails originId={selectedEntityId} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'regras' && <Rules />}
        </div>
      </main>

      {/* --- Roll Result Modal --- */}
      <AnimatePresence>
        {showLevelUpModal && (
          <LevelUpChoice 
            onComplete={() => setShowLevelUpModal(false)}
            onCancel={() => setShowLevelUpModal(false)}
          />
        )}
        {rollData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[60] bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setRollData(null)}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-gothic-card border-2 border-gothic-gold p-12 shadow-[0_0_50px_rgba(212,175,55,0.3)] relative text-center"
            >
              {rollData.isCritical && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gothic-red text-white font-medieval px-6 py-2 border-2 border-gothic-gold shadow-[0_0_20px_#8B0000]"
                >
                  CRÍTICO!
                </motion.div>
              )}
              {rollData.isFail && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-600 text-white font-medieval px-6 py-2 border-2 border-gray-400 shadow-[0_0_20px_#333]"
                >
                  FALHA!
                </motion.div>
              )}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-gothic-gold" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-gothic-gold" />
              
              <p className="font-cinzel text-sm text-gothic-gold tracking-widest uppercase mb-2 text-gothic-gold">Resultado Total</p>
              <h2 className={cn(
                "font-cinzel text-8xl font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                rollData.isCritical ? "text-gothic-red" : rollData.isFail ? "text-gray-500" : "text-white"
              )}>
                {rollData.result}
              </h2>
              <p className="text-gothic-text/40 text-xs mt-4 font-mono">
                1d20 + {rollData.bonus}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
