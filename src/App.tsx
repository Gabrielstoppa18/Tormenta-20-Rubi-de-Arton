/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sword,
  Book,
  Backpack,
  User,
  Menu,
  Dices,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Plus,
  PlusCircle,
  Sparkles,
  Skull,
  ZapOff,
  Moon,
  MessageSquare,
  Users,
  ChevronLeft,
  Star,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useCharacter } from './context/CharacterContext';
import { CLASSES, RACES } from './data/t20-data';
import { CharacterCreation } from './components/CharacterCreation';
import { PowersList } from './components/PowersList';
import { ClassDetails, RaceDetails, OriginDetails } from './components/CompendiumDetails';
import { LevelUpChoice } from './components/LevelUpChoice';
import { GroupView } from './components/GroupView';
import { RollLog } from './components/RollLog';
import { Auth } from './components/Auth';
import Rules from './components/Rules';
import { GeneralTab } from './components/tabs/GeneralTab';
import { CombatTab } from './components/tabs/CombatTab';
import { SkillsTab } from './components/tabs/SkillsTab';
import { InventoryTab } from './components/tabs/InventoryTab';
import { GrimoireTab } from './components/tabs/GrimoireTab';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { characterService } from './lib/character';
import { compendiumService } from './lib/compendium';
import { userService } from './lib/user';
import { groupService } from './lib/group';
import { rollService } from './lib/roll';
import type { Race, Class, Origin, Group, Roll, Character as DbCharacter } from './types/database';
import type { VFXType } from './types/vfx';

// --- VFX ---

const SOUNDS: Record<VFXType, string> = {
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
  audio.play().catch(() => {});
};

function VFXOverlay({ type, onComplete }: { type: VFXType; onComplete: () => void }) {
  useEffect(() => {
    playSound(type);
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [type, onComplete]);

  if (type === 'level-up') return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
    >
      <div className="absolute inset-0 bg-gothic-gold/10 backdrop-blur-[2px]" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[600px] h-[600px] border border-gothic-gold/20 rounded-full"
      />
      <div className="relative flex flex-col items-center px-4 text-center">
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-gothic-gold mb-4"
        >
          <Sparkles size={60} className="md:w-20 md:h-20" />
        </motion.div>
        <h2 className="font-cinzel text-4xl md:text-6xl font-bold text-gothic-gold drop-shadow-[0_0_20px_rgba(212,175,55,0.8)]">NÍVEL UP!</h2>
      </div>
    </motion.div>
  );

  if (type === 'crit-hit') return (
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
  );

  if (type === 'crit-fail') return (
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
  );

  if (type === 'attack') return (
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
  );

  if (type === 'spell') return (
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
      </motion.div>
    </motion.div>
  );

  return null;
}

// --- Tab config ---

type TabId = 'geral' | 'combate' | 'pericias' | 'inventario' | 'grimorio' | 'grupo' | 'compendio' | 'regras';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'geral', label: 'Geral', icon: <User size={18} /> },
  { id: 'combate', label: 'Combate', icon: <Sword size={18} /> },
  { id: 'pericias', label: 'Perícias', icon: <Star size={18} /> },
  { id: 'inventario', label: 'Inventário', icon: <Backpack size={18} /> },
  { id: 'grimorio', label: 'Grimório', icon: <Book size={18} /> },
  { id: 'grupo', label: 'Grupo', icon: <Users size={18} /> },
  { id: 'compendio', label: 'Compêndio', icon: <Backpack size={18} /> },
  { id: 'regras', label: 'Regras', icon: <Book size={18} /> },
];

const TAB_TITLES: Record<TabId, string> = {
  geral: 'Ficha do Herói',
  combate: 'Campo de Batalha',
  pericias: 'Habilidades e Treinos',
  inventario: 'Bolsa de Carga',
  grimorio: 'O Grimório Negro',
  grupo: 'Aliança de Heróis',
  compendio: 'Arquivos de Arthon',
  regras: 'Leis do Mundo',
};

// --- App ---

export default function App() {
  const {
    state,
    saveCharacter,
    saveStatus,
    loadCharacter,
    unloadCharacter,
    levelUp,
    levelDown,
    setGroupId,
    rest,
  } = useCharacter();

  const [activeTab, setActiveTab] = useState<TabId>('geral');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [compendioTab, setCompendioTab] = useState<'classes' | 'races' | 'origins' | 'powers'>('powers');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const [rollData, setRollData] = useState<{ result: number; bonus: number; isCritical: boolean; isFail: boolean } | null>(null);
  const [activeVFX, setActiveVFX] = useState<VFXType | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showRollLog, setShowRollLog] = useState(false);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);
  const [showCreation, setShowCreation] = useState(false);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  const [dbClasses, setDbClasses] = useState<Class[]>([]);
  const [dbRaces, setDbRaces] = useState<Race[]>([]);
  const [dbOrigins, setDbOrigins] = useState<Origin[]>([]);
  const [loadingCompendium, setLoadingCompendium] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<DbCharacter[]>([]);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [inviteCode, setInviteCode] = useState('');

  // --- Auth ---

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
      loadUserGroups();
    } else {
      setCharacters([]);
      setMyGroups([]);
      setCurrentCharacterId(null);
    }
  }, [user]);

  useEffect(() => {
    if (activeGroup) {
      const unsubGroup = groupService.subscribeToGroup(activeGroup.id, setActiveGroup);
      const unsubMembers = groupService.subscribeToGroupMembers(activeGroup.id, setGroupMembers);
      const unsubRolls = rollService.subscribeToGroupRolls(activeGroup.id, setRolls);
      return () => { unsubGroup(); unsubMembers(); unsubRolls(); };
    }
  }, [activeGroup?.id]);

  useEffect(() => {
    if (activeTab === 'compendio') loadCompendiumLists();
  }, [activeTab]);

  // --- Loaders ---

  const loadUserCharacters = async (): Promise<void> => {
    if (!user) return;
    setLoadingCharacters(true);
    try {
      const data = await characterService.getCharacters(user.uid);
      setCharacters(data);
    } catch (error) {
      console.error('Error loading characters:', error);
      setCharacters([]);
    } finally {
      setLoadingCharacters(false);
    }
  };

  const loadUserGroups = async () => {
    if (!user) return;
    const groups = await groupService.getGroups(user.uid);
    setMyGroups(groups);
    if (groups.length > 0 && !activeGroup) setActiveGroup(groups[0]);
  };

  const loadCompendiumLists = async () => {
    setLoadingCompendium(true);
    try {
      const [c, r, o] = await Promise.all([
        compendiumService.getClasses(),
        compendiumService.getRaces(),
        compendiumService.getOrigins(),
      ]);
      setDbClasses(c);
      setDbRaces(r);
      setDbOrigins(o);
    } catch (error) {
      console.error('Error loading compendium:', error);
    } finally {
      setLoadingCompendium(false);
    }
  };

  // --- Group handlers ---

  const handleCreateGroup = async (name: string) => {
    if (!user) return;
    const newGroup = await groupService.createGroup(name, user.uid);
    setMyGroups(prev => [...prev, newGroup]);
    setActiveGroup(newGroup);
    if (currentCharacterId) {
      setGroupId(newGroup.id);
      await characterService.updateCharacter(currentCharacterId, { group_id: newGroup.id });
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !inviteCode) return;
    const joined = await groupService.joinGroupByCode(inviteCode, user.uid);
    if (joined) {
      setMyGroups(prev => [...prev, joined]);
      setActiveGroup(joined);
      setInviteCode('');
      if (currentCharacterId) {
        setGroupId(joined.id);
        await characterService.updateCharacter(currentCharacterId, { group_id: joined.id });
      }
    } else {
      alert('Código de convite inválido.');
    }
  };

  // --- Character handlers ---

  const selectCharacter = async (id: string) => {
    setCurrentCharacterId(id);
    await loadCharacter(id);
  };

  const handleDeleteCharacter = async (id: string, name: string) => {
    if (!window.confirm(`Deseja excluir permanentemente a ficha de "${name}"? Esta ação não pode ser desfeita.`)) return;
    await characterService.deleteCharacter(id);
    setCharacters((prev: any[]) => prev.filter((c: any) => c.id !== id));
    if (currentCharacterId === id) {
      setCurrentCharacterId(null);
      unloadCharacter();
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  // --- VFX + Roll ---

  const triggerVFX = (type: VFXType) => {
    setActiveVFX(null);
    setTimeout(() => setActiveVFX(type), 10);
  };

  const handleRoll = async (bonus: number, type: VFXType = 'skill', label = '') => {
    const natural = Math.floor(Math.random() * 20) + 1;
    const isCritical = natural === 20;
    const isFail = natural === 1;
    const total = natural + bonus;

    setRollData({ result: total, bonus, isCritical, isFail });

    if (isCritical) triggerVFX('crit-hit');
    else if (isFail) triggerVFX('crit-fail');
    else triggerVFX(type);

    if (activeGroup && user && state.name) {
      await rollService.logRoll({
        user_id: user.uid,
        character_name: state.name,
        group_id: activeGroup.id,
        label: label || type.toUpperCase(),
        result: total,
        bonus,
        is_critical: isCritical,
        is_fail: isFail,
      });
    }

    setTimeout(() => setRollData(null), 4000);
  };

  const handleRollDamage = async (damage: string, name: string) => {
    const [diceStr, sidesStr] = damage.split('d');
    const dice = parseInt(diceStr) || 1;
    const sides = parseInt(sidesStr) || 6;
    let total = 0;
    for (let i = 0; i < dice; i++) total += Math.floor(Math.random() * sides) + 1;

    if (activeGroup && user && state.name) {
      await rollService.logRoll({
        user_id: user.uid,
        character_name: state.name,
        group_id: activeGroup.id,
        label: `Dano: ${name}`,
        result: total,
        bonus: 0,
        is_critical: false,
        is_fail: false,
      });
    }

    setRollData({ result: total, bonus: 0, isCritical: false, isFail: false });
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

  // --- Auth gate ---

  if (!user) return <Auth onSuccess={setUser} />;

  if (showCreation) {
    return (
      <CharacterCreation
        userId={user.uid}
        onComplete={(id) => {
          setCurrentCharacterId(id);
          setShowCreation(false);
          loadUserCharacters();
          loadCharacter(id);
        }}
        onCancel={() => setShowCreation(false)}
      />
    );
  }

  // --- Character selection screen ---

  if (!state.isLoaded) {
    return (
      <div className="flex h-screen bg-gothic-bg items-center justify-center p-4 md:p-8">
        <div className="max-w-md w-full space-y-6 md:space-y-8 text-center">
          <header>
            <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-gothic-gold mb-2 tracking-tighter">
              TORMENTA <span className="text-gothic-red">20</span>
            </h1>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-gothic-text/30">Arthon Gothic Edition</p>
          </header>

          <div className="bg-gothic-card border border-gothic-gold/20 p-4 md:p-8 space-y-6">
            <h2 className="font-cinzel text-lg md:text-xl text-gothic-gold uppercase tracking-widest">Seus Personagens</h2>

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
                  <div key={char.id} className="flex items-stretch gap-2">
                    <button
                      onClick={() => selectCharacter(char.id)}
                      className="flex-1 p-4 bg-black/40 border border-gothic-gold/10 hover:border-gothic-gold/40 text-left group transition-all"
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
                    <button
                      onClick={() => handleDeleteCharacter(char.id, char.name)}
                      className="px-3 border border-gothic-red/20 text-gothic-red/40 hover:bg-gothic-red/10 hover:text-gothic-red hover:border-gothic-red transition-all"
                      title="Excluir ficha"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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

  // --- Main app ---

  return (
    <div className="flex h-screen bg-gothic-bg overflow-hidden selection:bg-gothic-gold/30 relative">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 w-64 bg-black border-r border-gothic-gold/10 flex flex-col z-40 transition-transform duration-300 lg:relative lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="p-8">
          <h1 className="font-cinzel text-2xl font-bold text-gothic-gold leading-tight tracking-tighter">
            TORMENTA <span className="text-gothic-red">20</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.3em] text-gothic-text/30 mt-1">Arthon Gothic Edition</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto gothic-scroll">
          <div className="mb-6">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-[9px] font-bold text-gothic-gold/40 uppercase tracking-widest">Personagens</span>
              <button onClick={() => setShowCreation(true)} className="text-gothic-gold hover:text-white transition-colors">
                <Plus size={14} />
              </button>
            </div>
            {loadingCharacters ? (
              <div className="px-4 py-2 text-[10px] text-gothic-text/20 animate-pulse">Carregando...</div>
            ) : characters.length === 0 ? (
              <div className="px-4 py-2 text-[10px] text-gothic-text/20 italic">Nenhum personagem</div>
            ) : (
              characters.map(char => (
                <div key={char.id} className="flex items-center group/item">
                  <button
                    onClick={() => selectCharacter(char.id)}
                    className={cn(
                      'flex-1 text-left px-4 py-2 text-xs font-cinzel transition-all',
                      currentCharacterId === char.id ? 'text-gothic-gold bg-gothic-gold/5' : 'text-gothic-text/40 hover:text-gothic-gold/60',
                    )}
                  >
                    <div className="flex flex-col">
                      <span>{char.name}</span>
                      <span className="text-[8px] opacity-50 uppercase tracking-tighter">
                        {RACES[char.race_id]?.name || char.race_id} {CLASSES[char.class_id]?.name || char.class_id}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteCharacter(char.id, char.name)}
                    className="pr-3 text-gothic-red/0 group-hover/item:text-gothic-red/40 hover:!text-gothic-red transition-colors"
                    title="Excluir ficha"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="h-px bg-gothic-gold/10 mx-4 mb-4" />

          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
              className={cn(
                'w-full flex items-center gap-4 px-4 py-3 font-cinzel text-sm tracking-widest uppercase transition-all duration-300',
                activeTab === tab.id
                  ? 'bg-gothic-card text-gothic-red border-l-2 border-gothic-red'
                  : 'text-gothic-text/40 hover:text-gothic-gold hover:bg-gothic-card/30',
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

      {/* Main */}
      <main className="flex-1 overflow-y-auto gothic-scroll relative flex flex-col">
        <header className="sticky top-0 z-10 bg-gothic-bg/80 backdrop-blur-md border-b border-gothic-gold/5 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gothic-gold lg:hidden">
                <Menu size={20} />
              </button>
              <button
                onClick={() => setShowRollLog(!showRollLog)}
                className={cn(
                  'p-2 border border-gothic-gold/20 transition-all',
                  showRollLog ? 'bg-gothic-gold/10 text-gothic-gold' : 'text-gothic-text/40 hover:text-gothic-gold',
                )}
                title="Alternar Log de Combate"
              >
                <MessageSquare size={16} />
              </button>
              <h2 className="font-cinzel text-[10px] md:text-xs font-bold text-gothic-gold uppercase tracking-[0.2em] truncate max-w-[150px] md:max-w-none">
                {TAB_TITLES[activeTab]}
              </h2>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <Dices className="text-gothic-gold cursor-pointer hover:rotate-45 transition-transform" onClick={() => handleRoll(0)} />
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-3 md:gap-6 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => rest()}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border border-gothic-blue/30 text-gothic-blue hover:bg-gothic-blue hover:text-white transition-all font-cinzel text-[10px] font-bold uppercase tracking-widest"
            >
              <Moon size={14} />
              Descansar
            </button>
            <button
              onClick={saveCharacter}
              disabled={saveStatus === 'saving'}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border font-cinzel text-[10px] font-bold uppercase tracking-widest transition-all duration-300 disabled:cursor-wait',
                saveStatus === 'saved'  && 'border-green-700 text-green-400 bg-green-900/20',
                saveStatus === 'saving' && 'border-gothic-gold/20 text-gothic-gold/40 animate-pulse',
                saveStatus === 'error'  && 'border-gothic-red/60 text-gothic-red',
                (saveStatus === 'idle') && 'border-gothic-gold/30 text-gothic-gold hover:bg-gothic-gold hover:text-gothic-bg',
              )}
            >
              {saveStatus === 'saving' && '…'}
              {saveStatus === 'saved'  && '✓ Salvo'}
              {saveStatus === 'error'  && '✕ Erro'}
              {saveStatus === 'idle'   && 'Salvar'}
            </button>
            <div className="flex-shrink-0 flex items-center bg-gothic-card/50 border border-gothic-gold/20 p-1">
              <button
                onClick={levelDown}
                className="p-1.5 text-gothic-gold hover:bg-gothic-gold hover:text-gothic-bg transition-all"
                title="Level Down"
              >
                <ChevronDown size={14} />
              </button>
              <div className="px-2 md:px-3 font-cinzel text-[10px] md:text-xs font-bold text-gothic-gold border-x border-gothic-gold/20">
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
            <div className="hidden md:block">
              <Dices className="text-gothic-gold cursor-pointer hover:rotate-45 transition-transform" onClick={() => handleRoll(0)} />
            </div>
          </div>
        </header>

        <AnimatePresence>
          {activeVFX && <VFXOverlay type={activeVFX} onComplete={() => setActiveVFX(null)} />}
        </AnimatePresence>

        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
          {activeTab === 'geral' && <GeneralTab />}
          {activeTab === 'combate' && <CombatTab onRoll={handleRoll} onRollDamage={handleRollDamage} onTriggerVFX={triggerVFX} />}
          {activeTab === 'pericias' && <SkillsTab onRoll={handleRoll} />}
          {activeTab === 'inventario' && <InventoryTab />}
          {activeTab === 'grimorio' && <GrimoireTab onTriggerVFX={triggerVFX} />}

          {activeTab === 'grupo' && (
            <GroupView
              user={user}
              activeGroup={activeGroup}
              myGroups={myGroups}
              groupMembers={groupMembers}
              onSelectGroup={setActiveGroup}
              onCreateGroup={handleCreateGroup}
              onJoinGroup={handleJoinGroup}
            />
          )}

          {activeTab === 'compendio' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex gap-4 border-b border-gothic-gold/10 pb-4">
                {(['powers', 'classes', 'races', 'origins'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setCompendioTab(t); setSelectedEntityId(null); }}
                    className={cn(
                      'font-cinzel text-[10px] font-bold tracking-widest uppercase px-4 py-2 transition-all',
                      compendioTab === t ? 'text-gothic-gold border-b-2 border-gothic-gold' : 'text-gothic-text/40 hover:text-gothic-gold',
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
                  ) : (dbClasses.length > 0 ? dbClasses : Object.entries(CLASSES).map(([id, c]) => ({ id, name: c.name }))).map((c: { id: string; name: string }) => (
                    <button key={c.id} onClick={() => setSelectedEntityId(c.id)} className="p-6 bg-gothic-card border border-gothic-gold/10 hover:border-gothic-gold/40 transition-all text-left group">
                      <h4 className="font-cinzel text-xl font-bold text-gothic-gold group-hover:tracking-widest transition-all">{c.name}</h4>
                      <p className="text-[10px] text-gothic-text/40 mt-2 uppercase tracking-widest">Ver Detalhes</p>
                    </button>
                  ))}
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
                  ) : (dbRaces.length > 0 ? dbRaces : Object.entries(RACES).map(([id, r]) => ({ id, name: r.name }))).map((r: { id: string; name: string }) => (
                    <button key={r.id} onClick={() => setSelectedEntityId(r.id)} className="p-6 bg-gothic-card border border-gothic-gold/10 hover:border-gothic-gold/40 transition-all text-left group">
                      <h4 className="font-cinzel text-xl font-bold text-gothic-gold group-hover:tracking-widest transition-all">{r.name}</h4>
                      <p className="text-[10px] text-gothic-text/40 mt-2 uppercase tracking-widest">Ver Detalhes</p>
                    </button>
                  ))}
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
                  ) : dbOrigins.length > 0 ? dbOrigins.map((o: { id: string; name: string }) => (
                    <button key={o.id} onClick={() => setSelectedEntityId(o.id)} className="p-6 bg-gothic-card border border-gothic-gold/10 hover:border-gothic-gold/40 transition-all text-left group">
                      <h4 className="font-cinzel text-xl font-bold text-gothic-gold group-hover:tracking-widest transition-all">{o.name}</h4>
                      <p className="text-[10px] text-gothic-text/40 mt-2 uppercase tracking-widest">Ver Detalhes</p>
                    </button>
                  )) : (
                    <div className="col-span-full p-8 text-center border border-dashed border-gothic-gold/20">
                      <p className="font-cinzel text-gothic-text/40">Nenhuma origem encontrada. Sincronize o Compêndio.</p>
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

      {/* Roll result modal */}
      <AnimatePresence>
        {showLevelUpModal && (
          <LevelUpChoice onComplete={() => setShowLevelUpModal(false)} onCancel={() => setShowLevelUpModal(false)} />
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
              className="bg-gothic-card border-2 border-gothic-gold p-6 md:p-12 shadow-[0_0_50px_rgba(212,175,55,0.3)] relative text-center mx-4"
            >
              {rollData.isCritical && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gothic-red text-white font-medieval px-4 md:px-6 py-2 border-2 border-gothic-gold shadow-[0_0_20px_#8B0000] whitespace-nowrap"
                >
                  CRÍTICO!
                </motion.div>
              )}
              {rollData.isFail && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-600 text-white font-medieval px-4 md:px-6 py-2 border-2 border-gray-400 shadow-[0_0_20px_#333] whitespace-nowrap"
                >
                  FALHA!
                </motion.div>
              )}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-gothic-gold" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-gothic-gold" />
              <p className="font-cinzel text-[10px] md:text-sm text-gothic-gold tracking-widest uppercase mb-2">Resultado Total</p>
              <h2 className={cn(
                'font-cinzel text-6xl md:text-8xl font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]',
                rollData.isCritical ? 'text-gothic-red' : rollData.isFail ? 'text-gray-500' : 'text-white',
              )}>
                {rollData.result}
              </h2>
              <p className="text-gothic-text/40 text-[10px] md:text-xs mt-4 font-mono">1d20 + {rollData.bonus}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roll log sidebar */}
      <AnimatePresence>
        {showRollLog && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden xl:block z-20"
          >
            <RollLog rolls={rolls} onClose={() => setShowRollLog(false)} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
