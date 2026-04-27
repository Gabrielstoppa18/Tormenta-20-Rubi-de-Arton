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
  ChevronLeft,
  Moon,
  Save,
  LogOut,
  CheckCircle2,
  Circle,
  Users,
  MessageSquare,
  Play,
  Target,
  Clock
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
import { GroupView } from './components/GroupView';
import { RollLog } from './components/RollLog';
import { Auth } from './components/Auth';
import Rules from './components/Rules';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { characterService } from './lib/character';
import { compendiumService } from './lib/compendium';
import { powersRules, getBlockedPowers } from './lib/rules/powers';
import { userService } from './lib/user';
import { groupService } from './lib/group';
import { rollService } from './lib/roll';
import type { Race, Class, Origin, Group, Roll, Character as DbCharacter } from './types/database';

// --- Components ---

const Attribute = ({ label, value, modifier, onUpdate }: { label: string; value: number; modifier: number; onUpdate: (val: number) => void }) => (
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
        <span className={cn(
          "text-[10px] font-bold mt-0.5 uppercase",
          modifier >= 0 ? "text-gothic-gold" : "text-gothic-red"
        )}>
          {modifier >= 0 ? `+${modifier}` : modifier}
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

const InventoryItem = ({ 
  item, 
  onUpdate, 
  onRemove, 
  onToggleEquip 
}: { 
  item: T20InventoryItem; 
  onUpdate: (updates: Partial<T20InventoryItem>) => void; 
  onRemove: () => void; 
  onToggleEquip: () => void;
  key?: React.Key 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const isEquippable = item.type.includes('Arma') || item.type.includes('Armadura') || item.type.includes('Escudo');

  const getIcon = () => {
    const lowerType = item.type.toLowerCase();
    if (lowerType.includes('arma')) return <Sword size={14} className={cn(item.isEquipped ? "text-gothic-bg" : "text-gothic-gold/60")} />;
    if (lowerType.includes('armadura') || lowerType.includes('escudo')) return <Shield size={14} className={cn(item.isEquipped ? "text-gothic-bg" : "text-gothic-gold/60")} />;
    return <Backpack size={14} className="text-gothic-gold/60" />;
  };

  return (
    <div className={cn(
      "flex flex-col p-4 bg-gothic-card/40 border transition-all group",
      item.isEquipped ? "border-gothic-gold shadow-[0_0_15px_rgba(191,155,48,0.1)]" : "border-gothic-gold/10 hover:border-gothic-gold/30"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={cn(
            "p-2 border transition-colors",
            item.isEquipped ? "bg-gothic-gold border-gothic-gold" : "bg-gothic-bg border-gothic-gold/10"
          )}>
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
              <h5 className={cn(
                "font-cinzel text-xs font-bold transition-colors",
                item.isEquipped ? "text-gothic-gold" : "text-gothic-text group-hover:text-gothic-gold"
              )}>{item.name}</h5>
            )}
            <p className="text-[9px] text-gothic-text/40 uppercase tracking-tighter">{item.type} • {item.weight}kg • {item.cost}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEquippable && (
            <button 
              onClick={onToggleEquip}
              className={cn(
                "px-2 py-0.5 text-[8px] font-bold uppercase tracking-tighter border transition-all",
                item.isEquipped 
                  ? "bg-gothic-gold border-gothic-gold text-gothic-bg" 
                  : "border-gothic-gold/30 text-gothic-gold hover:bg-gothic-gold/10"
              )}
            >
              {item.isEquipped ? 'Equipado' : 'Equipar'}
            </button>
          )}
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
    cargaMaxima,
    cargaAtual,
    armorPenalty,
    resistencia,
    combate,
    setName,
    setRace,
    setClass,
    setDeity,
    setGroupId,
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
    toggleEquip,
    removeItem,
    castSpell,
    rest,
    calculateSkillValue,
    addTrainedSkill,
    removeTrainedSkill,
    levelUp,
    levelDown,
    getValidatableCharacter,
    saveCharacter,
    loadCharacter,
    unloadCharacter,
    toggleCondition
  } = useCharacter();

  const [activeTab, setActiveTab] = useState<'geral' | 'combate' | 'pericias' | 'inventario' | 'grimorio' | 'grupo' | 'compendio' | 'regras'>('geral');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [compendioTab, setCompendioTab] = useState<'classes' | 'races' | 'origins' | 'powers'>('powers');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  const [rollData, setRollData] = useState<{ result: number; bonus: number; isCritical: boolean; isFail: boolean } | null>(null);
  const [showAddPower, setShowAddPower] = useState(false);
  const [powerFilter, setPowerFilter] = useState<string>('Todos');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddSpell, setShowAddSpell] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<string | null>(null);
  const [spellSearch, setSpellSearch] = useState('');
  const [spellCircleFilter, setSpellCircleFilter] = useState<number | null>(null);
  const [activeVFX, setActiveVFX] = useState<VFXType | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);

  const getPowerType = (requirements: string[] | any) => {
    if (!Array.isArray(requirements)) return 'Geral';
    if (requirements.some((r: any) => typeof r === 'string' && r.startsWith('Raça:'))) return 'Raça';
    if (requirements.some((r: any) => typeof r === 'string' && r.startsWith('Origem:'))) return 'Origem';
    if (requirements.some((r: any) => typeof r === 'string' && r.startsWith('Classe:'))) return 'Classe';
    if (requirements.some((r: any) => typeof r === 'string' && r.startsWith('Divindade:'))) return 'Concedido';
    return 'Geral';
  };

  const formatRequirements = (requirements: any) => {
    if (!Array.isArray(requirements)) return [];
    if (requirements.length === 0) return [];
    
    // If it's a simple string array (old format)
    if (typeof requirements[0] === 'string') return requirements;
    
    // If it's a RequirementGroup[] (new format)
    // Flatten for simple display, maybe join groups with OR?
    return requirements.map((group: any) => {
      if (!Array.isArray(group)) return String(group);
      return group.map((req: any) => {
        switch(req.type) {
          case 'characterLevel': return `Nível ${req.min}`;
          case 'classLevel': return `${req.classId} nível ${req.min}`;
          case 'attribute': return `${req.attribute.toUpperCase()} ${req.min}`;
          case 'power': return `Poder ${req.powerId}`;
          default: return req.type;
        }
      }).join(' e ');
    });
  };
  
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

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<DbCharacter[]>([]);
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showRollLog, setShowRollLog] = useState(false);

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
      return () => {
        unsubGroup();
        unsubMembers();
        unsubRolls();
      };
    }
  }, [activeGroup?.id]);

  const loadUserGroups = async () => {
    if (!user) return;
    const groups = await groupService.getGroups(user.uid);
    setMyGroups(groups);
    if (groups.length > 0 && !activeGroup) {
      setActiveGroup(groups[0]);
    }
  };

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
      setShowInviteInput(false);
      
      if (currentCharacterId) {
        setGroupId(joined.id);
        await characterService.updateCharacter(currentCharacterId, { group_id: joined.id });
      }
    } else {
      alert('Código de convite inválido.');
    }
  };

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

  const handleRoll = async (bonus: number, type: VFXType = 'skill', label: string = '') => {
    const natural = Math.floor(Math.random() * 20) + 1;
    const isCritical = natural === 20;
    const isFail = natural === 1;
    const total = natural + bonus;

    setRollData({
      result: total,
      bonus: bonus,
      isCritical,
      isFail
    });

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
        is_fail: isFail
      });
    }

    setTimeout(() => setRollData(null), 4000);
  };

  const handleRollDamage = async (damage: string, name: string) => {
    const [diceStr, sidesStr] = damage.split('d');
    const dice = parseInt(diceStr) || 1;
    const sides = parseInt(sidesStr) || 6;
    
    let total = 0;
    for (let i = 0; i < dice; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }

    if (activeGroup && user && state.name) {
      await rollService.logRoll({
        user_id: user.uid,
        character_name: state.name,
        group_id: activeGroup.id,
        label: `Dano: ${name}`,
        result: total,
        bonus: 0,
        is_critical: false,
        is_fail: false
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

  const tabs = [
    { id: 'geral', label: 'Geral', icon: <User size={18} /> },
    { id: 'combate', label: 'Combate', icon: <Sword size={18} /> },
    { id: 'pericias', label: 'Perícias', icon: <Star size={18} /> },
    { id: 'inventario', label: 'Inventário', icon: <Backpack size={18} /> },
    { id: 'grimorio', label: 'Grimório', icon: <Book size={18} /> },
    { id: 'grupo', label: 'Grupo', icon: <Users size={18} /> },
    { id: 'compendio', label: 'Compêndio', icon: <Backpack size={18} /> },
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
    <div className="flex h-screen bg-gothic-bg overflow-hidden selection:bg-gothic-gold/30 relative">
      {/* --- Mobile Overlay --- */}
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

      {/* --- Sidebar --- */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-black border-r border-gothic-gold/10 flex flex-col z-40 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
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
              onClick={() => {
                setActiveTab(tab.id);
                setIsSidebarOpen(false);
              }}
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
      <main className="flex-1 overflow-y-auto gothic-scroll relative flex flex-col">
        <header className="sticky top-0 z-10 bg-gothic-bg/80 backdrop-blur-md border-b border-gothic-gold/5 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-gothic-gold lg:hidden"
              >
                <Menu size={20} />
              </button>
              <button 
                onClick={() => setShowRollLog(!showRollLog)}
                className={cn(
                  "p-2 border border-gothic-gold/20 transition-all",
                  showRollLog ? "bg-gothic-gold/10 text-gothic-gold" : "text-gothic-text/40 hover:text-gothic-gold"
                )}
                title="Alternar Log de Combate"
              >
                <MessageSquare size={16} />
              </button>
              <h2 className="font-cinzel text-[10px] md:text-xs font-bold text-gothic-gold uppercase tracking-[0.2em] truncate max-w-[150px] md:max-w-none">
                {activeTab === 'geral' && 'Ficha do Herói'}
                {activeTab === 'combate' && 'Campo de Batalha'}
                {activeTab === 'pericias' && 'Habilidades e Treinos'}
                {activeTab === 'inventario' && 'Bolsa de Carga'}
                {activeTab === 'grimorio' && 'O Grimório Negro'}
                {activeTab === 'grupo' && 'Aliança de Heróis'}
                {activeTab === 'compendio' && 'Arquivos de Arthon'}
                {activeTab === 'regras' && 'Leis do Mundo'}
              </h2>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <Dices 
                className="text-gothic-gold cursor-pointer hover:rotate-45 transition-transform" 
                onClick={() => handleRoll(0)}
              />
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-end gap-3 md:gap-6 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button 
              onClick={() => {
                rest();
                triggerVFX('level-up');
              }}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border border-gothic-blue/30 text-gothic-blue hover:bg-gothic-blue hover:text-white transition-all font-cinzel text-[10px] font-bold uppercase tracking-widest"
            >
              <Moon size={14} />
              Descansar
            </button>
            <button 
              onClick={saveCharacter}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border border-gothic-gold/30 text-gothic-gold hover:bg-gothic-gold hover:text-gothic-bg transition-all font-cinzel text-[10px] font-bold uppercase tracking-widest"
            >
              Salvar
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
              <Dices 
                className="text-gothic-gold cursor-pointer hover:rotate-45 transition-transform" 
                onClick={() => handleRoll(0)}
              />
            </div>
          </div>
        </header>

        <AnimatePresence>
          {activeVFX && <VFXOverlay type={activeVFX} onComplete={() => setActiveVFX(null)} />}
        </AnimatePresence>

        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
          {activeTab === 'geral' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Basic Info */}
              <section className="bg-gothic-card p-4 md:p-8 border border-gothic-gold/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
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
                      <option value="" className="bg-gothic-card">Nenhuma</option>
                      {Object.entries(DEITIES).map(([id, d]) => <option key={id} value={id} className="bg-gothic-card">{d.name}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Attributes Grid */}
              <section className="bg-gothic-card/30 p-4 md:p-8 border border-gothic-gold/5">
                <div className="flex items-center gap-4 mb-8">
                  <Settings className="text-gothic-gold" size={20} />
                  <h3 className="font-cinzel text-lg md:text-xl font-bold tracking-widest uppercase text-gothic-gold">Atributos (JdA)</h3>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8">
                  <Attribute label="FOR" value={state.attributes.for} modifier={modifiers.for} onUpdate={(v) => setAttribute('for', v)} />
                  <Attribute label="DES" value={state.attributes.des} modifier={modifiers.des} onUpdate={(v) => setAttribute('des', v)} />
                  <Attribute label="CON" value={state.attributes.con} modifier={modifiers.con} onUpdate={(v) => setAttribute('con', v)} />
                  <Attribute label="INT" value={state.attributes.int} modifier={modifiers.int} onUpdate={(v) => setAttribute('int', v)} />
                  <Attribute label="SAB" value={state.attributes.sab} modifier={modifiers.sab} onUpdate={(v) => setAttribute('sab', v)} />
                  <Attribute label="CAR" value={state.attributes.car} modifier={modifiers.car} onUpdate={(v) => setAttribute('car', v)} />
                </div>
              </section>

              {/* Powers Management */}
              <section className="bg-gothic-card p-4 md:p-8 border border-gothic-gold/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <Trophy className="text-gothic-gold" size={20} />
                    <h3 className="font-cinzel text-lg md:text-xl font-bold tracking-widest uppercase text-gothic-gold">Poderes e Habilidades</h3>
                  </div>
                  <button 
                    onClick={() => setShowAddPower(!showAddPower)}
                    className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gothic-gold hover:text-white transition-colors"
                  >
                    <PlusCircle size={16} />
                    ADICIONAR PODER
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {['Todos', 'Geral', 'Classe', 'Raça', 'Origem', 'Concedido'].map(type => (
                    <button
                      key={type}
                      onClick={() => setPowerFilter(type)}
                      className={cn(
                        "px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all",
                        powerFilter === type 
                          ? "bg-gothic-gold text-gothic-bg border-gothic-gold" 
                          : "bg-black/20 text-gothic-gold/40 border-gothic-gold/10 hover:border-gothic-gold/40"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {showAddPower && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-4 bg-black/40 border border-gothic-gold/20">
                    {/* Combine existing POWERS with new powersRules */}
                    {[
                      ...POWERS,
                      ...powersRules.map(pr => ({
                        id: pr.id,
                        name: pr.name,
                        description: pr.summary,
                        requirements: pr.requirements as any, // Will handle in display
                        type: pr.category,
                        isRuleBased: true,
                        rule: pr
                      }))
                    ]
                      .filter(p => !state.powers.find(sp => sp.name === p.name))
                      .filter(p => {
                        const type = (p as any).isRuleBased ? (p as any).type : getPowerType(p.requirements);
                        return powerFilter === 'Todos' || (type.toLowerCase() === powerFilter.toLowerCase());
                      })
                      .map(power => {
                        const charInfo = getValidatableCharacter();
                        let isBlocked = false;
                        let reason = "";

                        if ((power as any).isRuleBased) {
                          const blocked = getBlockedPowers(charInfo, [(power as any).rule]);
                          if (blocked.length > 0) {
                            isBlocked = true;
                            reason = blocked[0].reason;
                          }
                        }

                        return (
                          <div key={power.name} className={cn(
                            "p-3 border transition-colors relative group",
                            isBlocked ? "border-gothic-red/20 opacity-60" : "border-gothic-gold/10 hover:border-gothic-gold/40"
                          )}>
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <h5 className={cn("font-cinzel text-xs font-bold", isBlocked ? "text-gothic-red/60" : "text-gothic-text")}>
                                  {power.name}
                                </h5>
                                <span className="text-[8px] text-gothic-gold/40 uppercase tracking-tighter">
                                  {(power as any).isRuleBased ? (power as any).type : getPowerType(power.requirements)}
                                </span>
                              </div>
                              {!isBlocked && (
                                <button onClick={() => addPower(power as any)} className="text-gothic-gold hover:text-white">
                                  <Plus size={14}/>
                                </button>
                              )}
                              {isBlocked && (
                                <div className="text-gothic-red/60" title={reason}>
                                  <ZapOff size={14} />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-gothic-text/40 mt-1 line-clamp-2">{power.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {formatRequirements(power.requirements).map(req => (
                                <span key={req} className="text-[8px] px-1 py-0.5 bg-black/20 text-gothic-gold/30 border border-gothic-gold/5">
                                  {req}
                                </span>
                              ))}
                            </div>
                            {isBlocked && (
                              <p className="text-[9px] text-gothic-red/80 mt-1 font-bold italic">{reason}</p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.powers
                    .filter(p => {
                      const type = p.type || getPowerType(p.requirements);
                      return powerFilter === 'Todos' || type === powerFilter;
                    })
                    .map((power) => (
                      <div key={power.id || power.name} className="p-4 bg-gothic-card/40 border border-gothic-gold/10 relative group">
                      <button 
                        onClick={() => removePower(power.id || power.name)}
                        className="absolute top-2 right-2 text-gothic-red/40 hover:text-gothic-red opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="flex justify-between items-start">
                        <h5 className="font-cinzel text-sm font-bold text-gothic-gold">{power.name}</h5>
                        <span className="text-[8px] text-gothic-gold/40 uppercase tracking-tighter">{power.type || getPowerType(power.requirements)}</span>
                      </div>
                      <p className="text-[11px] text-gothic-text/60 mt-2 leading-relaxed">{power.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formatRequirements(power.requirements).map(req => (
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
                <div className="lg:col-span-2 bg-gothic-card p-4 md:p-8 border border-gothic-gold/10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* PV Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2 text-gothic-red">
                          <Heart size={14} />
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Vida (PV)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => takeDamage(1)} className="text-gothic-red/60 hover:text-gothic-red"><Minus size={12}/></button>
                          <span className="font-cinzel text-base md:text-lg text-gothic-text">{state.currentPV} / {maxPV}</span>
                          <button onClick={() => takeDamage(-1)} className="text-gothic-red/60 hover:text-gothic-red"><Plus size={12}/></button>
                        </div>
                      </div>
                      <div className="h-3 md:h-4 bg-black border border-gothic-gold/20 p-0.5">
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
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Mana (PM)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => spendPM(1)} className="text-gothic-blue/60 hover:text-gothic-blue"><Minus size={12}/></button>
                          <span className="font-cinzel text-base md:text-lg text-gothic-text">{state.currentPM} / {maxPM}</span>
                          <button onClick={() => spendPM(-1)} className="text-gothic-blue/60 hover:text-gothic-blue"><Plus size={12}/></button>
                        </div>
                      </div>
                      <div className="h-3 md:h-4 bg-black border border-gothic-gold/20 p-0.5">
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
                    <div className="flex items-center justify-between">
                      <h4 className="font-cinzel text-xs font-bold text-gothic-gold uppercase tracking-widest">Ataques</h4>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] text-gothic-text/40 uppercase">Luta</span>
                          <span className="text-xs font-bold text-gothic-gold">+{combate.luta}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] text-gothic-text/40 uppercase">Pontaria</span>
                          <span className="text-xs font-bold text-gothic-gold">+{combate.pontaria}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {combate.ataques.map((ataque, idx) => (
                        <div key={idx} className="p-4 bg-black/40 border border-gothic-gold/10 group hover:border-gothic-gold/40 transition-colors">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <Sword size={16} className="text-gothic-gold/60" />
                              <div>
                                <h5 className="font-cinzel text-sm font-bold text-gothic-text">{ataque.name}</h5>
                                <p className="text-[10px] text-gothic-text/40 uppercase tracking-tighter">
                                  Dano: <span className="text-gothic-gold">{ataque.damage}</span> | 
                                  Crítico: <span className="text-gothic-gold">{ataque.criticalRange > 20 ? 20 : ataque.criticalRange}/x{ataque.criticalMultiplier}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleRoll(ataque.bonus, 'attack', `Ataque: ${ataque.name}`)}
                                className="px-4 py-1.5 bg-gothic-gold/10 border border-gothic-gold/30 text-gothic-gold font-cinzel text-[10px] font-bold hover:bg-gothic-gold hover:text-gothic-bg transition-all"
                              >
                                TESTE (+{ataque.bonus})
                              </button>
                              <button 
                                onClick={() => handleRollDamage(ataque.damage, ataque.name)}
                                className="px-4 py-1.5 bg-gothic-red/10 border border-gothic-red/30 text-gothic-red font-cinzel text-[10px] font-bold hover:bg-gothic-red hover:text-white transition-all"
                              >
                                DANO
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Defense & Resistances */}
                <div className="space-y-8">
                  <div className="bg-gothic-card p-8 border border-gothic-gold/10 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                      <Shield size={100} className="text-gothic-gold/10 fill-gothic-gold/5" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                        <span className="text-[9px] font-bold text-gothic-gold/60 uppercase tracking-[0.2em] mb-1">Defesa</span>
                        <p className="font-cinzel text-4xl font-bold text-gothic-gold leading-none">{defesa}</p>
                      </div>
                    </div>
                    
                    <div className="w-full pt-4 border-t border-gothic-gold/5 text-left">
                      <p className="text-[8px] text-gothic-text/40 uppercase tracking-widest mb-2">Cálculo de Defesa</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px]">
                        <div className="text-gothic-text/60">Base</div><div className="text-right text-gothic-gold">10</div>
                        <div className="text-gothic-text/60">Destreza</div><div className="text-right text-gothic-gold">+{modifiers.des}</div>
                        {state.inventory.find(i => i.isEquipped && i.type.includes('Armadura')) && (
                          <>
                            <div className="text-gothic-text/60">Armadura</div>
                            <div className="text-right text-gothic-gold">+{ITEMS[state.inventory.find(i => i.isEquipped && i.type.includes('Armadura'))!.name]?.defenseBonus || 0}</div>
                          </>
                        )}
                        {state.inventory.find(i => i.isEquipped && i.type.includes('Escudo')) && (
                          <>
                            <div className="text-gothic-text/60">Escudo</div>
                            <div className="text-right text-gothic-gold">+{ITEMS[state.inventory.find(i => i.isEquipped && i.type.includes('Escudo'))!.name]?.defenseBonus || 0}</div>
                          </>
                        )}
                        {state.defenseBonus !== 0 && (
                          <>
                            <div className="text-gothic-text/60">Outros</div>
                            <div className="text-right text-gothic-gold">{state.defenseBonus > 0 ? '+' : ''}{state.defenseBonus}</div>
                          </>
                        )}
                        {state.conditions.includes('Fatigado') && (
                          <>
                            <div className="text-gothic-red/60">Fatigado</div>
                            <div className="text-right text-gothic-red">-2</div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="w-full pt-4 border-t border-gothic-gold/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gothic-text/40 uppercase tracking-widest">Ajuste Manual</span>
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

                  {/* Conditions Section */}
                  <div className="bg-gothic-card p-6 border border-gothic-gold/10 space-y-4">
                    <h4 className="font-cinzel text-[10px] font-bold text-gothic-gold uppercase tracking-widest border-b border-gothic-gold/10 pb-2">Condições</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Fatigado', 'Debilitado', 'Esmorecido', 'Enredado', 'Abatido'].map(cond => (
                        <button
                          key={cond}
                          onClick={() => toggleCondition(cond)}
                          className={cn(
                            "px-3 py-1 text-[9px] font-bold uppercase tracking-tighter border transition-all",
                            state.conditions.includes(cond)
                              ? "bg-gothic-red/20 border-gothic-red text-gothic-red"
                              : "bg-black/40 border-gothic-gold/10 text-gothic-text/40 hover:border-gothic-gold/30"
                          )}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gothic-card p-6 border border-gothic-gold/10 space-y-4">
                    <h4 className="font-cinzel text-[10px] font-bold text-gothic-gold uppercase tracking-widest border-b border-gothic-gold/10 pb-2">Resistências</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div 
                        onClick={() => handleRoll(resistencia.fortitude, 'skill')}
                        className="flex justify-between items-center p-2 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors border border-transparent hover:border-gothic-gold/20"
                      >
                        <span className="text-[10px] font-bold text-gothic-text/60 uppercase tracking-widest">Fortitude (CON)</span>
                        <span className="font-cinzel text-sm font-bold text-gothic-gold">+{resistencia.fortitude}</span>
                      </div>
                      <div 
                        onClick={() => handleRoll(resistencia.reflexos, 'skill')}
                        className="flex justify-between items-center p-2 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors border border-transparent hover:border-gothic-gold/20"
                      >
                        <span className="text-[10px] font-bold text-gothic-text/60 uppercase tracking-widest">Reflexos (DES)</span>
                        <span className="font-cinzel text-sm font-bold text-gothic-gold">+{resistencia.reflexos}</span>
                      </div>
                      <div 
                        onClick={() => handleRoll(resistencia.vontade, 'skill')}
                        className="flex justify-between items-center p-2 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors border border-transparent hover:border-gothic-gold/20"
                      >
                        <span className="text-[10px] font-bold text-gothic-text/60 uppercase tracking-widest">Vontade (SAB)</span>
                        <span className="font-cinzel text-sm font-bold text-gothic-gold">+{resistencia.vontade}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gothic-card p-6 border border-gothic-gold/10 space-y-4">
                    <div className="flex justify-between items-center border-b border-gothic-gold/10 pb-2">
                      <h4 className="font-cinzel text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Equipamento Atual</h4>
                      {armorPenalty > 0 && (
                        <span className="text-[8px] font-bold text-gothic-red uppercase tracking-tighter">Penalidade: -{armorPenalty}</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gothic-text/40 uppercase">Armadura</span>
                        <span className="text-xs font-bold text-gothic-text">
                          {state.inventory.find(i => i.isEquipped && i.type.includes('Armadura'))?.name || 'Nenhuma'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gothic-text/40 uppercase">Escudo</span>
                        <span className="text-xs font-bold text-gothic-text">
                          {state.inventory.find(i => i.isEquipped && i.type.includes('Escudo'))?.name || 'Nenhum'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gothic-card p-6 border border-gothic-gold/10 space-y-4">
                    <h4 className="font-cinzel text-[10px] font-bold text-gothic-gold uppercase tracking-widest border-b border-gothic-gold/10 pb-2">Outros</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div 
                        onClick={() => handleRoll(combate.iniciativa, 'skill')}
                        className="flex justify-between items-center p-2 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors border border-transparent hover:border-gothic-gold/20"
                      >
                        <span className="text-[10px] font-bold text-gothic-text/60 uppercase tracking-widest">Iniciativa</span>
                        <span className="font-cinzel text-sm font-bold text-gothic-gold">+{combate.iniciativa}</span>
                      </div>
                      <div 
                        onClick={() => handleRoll(combate.percepcao, 'skill')}
                        className="flex justify-between items-center p-2 bg-black/20 hover:bg-black/40 cursor-pointer transition-colors border border-transparent hover:border-gothic-gold/20"
                      >
                        <span className="text-[10px] font-bold text-gothic-text/60 uppercase tracking-widest">Percepção</span>
                        <span className="font-cinzel text-sm font-bold text-gothic-gold">+{combate.percepcao}</span>
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
                  const isTrained = state.trainedSkills.includes(skillName);
                  const bonus = calculateSkillValue(skillName);
                  return (
                    <div key={skillName} className={cn(
                      "flex items-center justify-between p-2 border-b border-gothic-gold/5 transition-colors group",
                      isTrained ? "bg-gothic-gold/5" : "hover:bg-gothic-card/40"
                    )}>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isTrained) removeTrainedSkill(skillName);
                            else addTrainedSkill(skillName);
                          }}
                          className={cn(
                            "transition-colors",
                            isTrained ? "text-gothic-gold" : "text-gothic-text/20 hover:text-gothic-gold/40"
                          )}
                        >
                          {isTrained ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        </button>
                        <span 
                          onClick={() => handleRoll(bonus, 'skill')}
                          className={cn(
                            "font-cinzel text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer",
                            isTrained ? "text-gothic-gold" : "text-gothic-text/60 group-hover:text-gothic-gold"
                          )}
                        >
                          {skillName}
                        </span>
                      </div>
                      <span 
                        onClick={() => handleRoll(bonus, 'skill')}
                        className="font-cinzel text-sm font-bold text-gothic-gold cursor-pointer"
                      >
                        {bonus >= 0 ? `+${bonus}` : bonus}
                      </span>
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
                <div className="space-y-4 mb-8 p-6 bg-black/40 border border-gothic-gold/20">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input 
                      type="text"
                      placeholder="Buscar item..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="flex-1 bg-black/60 border border-gothic-gold/20 p-2 font-cinzel text-xs text-gothic-text outline-none focus:border-gothic-gold/40"
                    />
                    <select 
                      value={itemTypeFilter || ''}
                      onChange={(e) => setItemTypeFilter(e.target.value || null)}
                      className="bg-black/60 border border-gothic-gold/20 p-2 font-cinzel text-xs text-gothic-text outline-none focus:border-gothic-gold/40"
                    >
                      <option value="">Todos os Tipos</option>
                      {Array.from(new Set(Object.values(ITEMS).map(i => i.type))).sort().map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.values(ITEMS)
                      .filter(item => {
                        const matchesSearch = item.name.toLowerCase().includes(itemSearch.toLowerCase());
                        const matchesType = !itemTypeFilter || item.type === itemTypeFilter;
                        return matchesSearch && matchesType;
                      })
                      .map(item => (
                        <div key={item.name} className="p-3 border border-gothic-gold/10 hover:border-gothic-gold/40 transition-colors bg-gothic-card/20 group">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-cinzel text-xs font-bold text-gothic-text group-hover:text-gothic-gold transition-colors">{item.name}</h5>
                              <p className="text-[8px] text-gothic-text/40 uppercase">{item.type} • {item.weight}kg</p>
                            </div>
                            <button 
                              onClick={() => addItem(item.name)} 
                              className="text-gothic-gold hover:text-white transition-colors"
                              title="Adicionar ao Inventário"
                            >
                              <Plus size={14}/>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Encumbrance Bar */}
              <div className="bg-black/40 p-6 border border-gothic-gold/10 space-y-4 mb-8">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <h4 className="font-cinzel text-xs font-bold text-gothic-gold uppercase tracking-widest">Carga Total</h4>
                    <p className="text-[10px] text-gothic-text/40 uppercase tracking-tighter">Capacidade Máxima: {cargaMaxima} kg</p>
                  </div>
                  <span className={cn(
                    "font-cinzel text-xl font-bold",
                    cargaAtual > cargaMaxima ? "text-gothic-red" : "text-gothic-gold"
                  )}>
                    {cargaAtual.toFixed(1)} / {cargaMaxima}
                  </span>
                </div>
                <div className="h-1.5 bg-black/60 border border-gothic-gold/10 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (cargaAtual / cargaMaxima) * 100)}%` }}
                    className={cn(
                      "h-full transition-colors duration-500",
                      cargaAtual > cargaMaxima ? "bg-gothic-red" : "bg-gothic-gold"
                    )}
                  />
                </div>
                {cargaAtual > cargaMaxima && (
                  <p className="text-[9px] text-gothic-red font-bold uppercase text-center animate-pulse tracking-widest">
                    Sobrecarga! Você está com penalidade de deslocamento e testes físicos.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.inventory.map((item) => (
                  <InventoryItem 
                    key={item.id}
                    item={item}
                    onUpdate={(updates) => updateItem(item.id, updates)}
                    onRemove={() => removeItem(item.id)}
                    onToggleEquip={() => toggleEquip(item.id)}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {SPELLS
                      .filter(s => !state.spells.find(ss => ss.name === s.name))
                      .filter(spell => {
                        const matchesSearch = spell.name.toLowerCase().includes(spellSearch.toLowerCase());
                        const matchesCircle = !spellCircleFilter || spell.circle === spellCircleFilter;
                        return matchesSearch && matchesCircle;
                      })
                      .map(spell => (
                        <div key={spell.name} className="p-3 border border-gothic-gold/10 hover:border-gothic-gold/40 transition-colors bg-gothic-card/20 group">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-cinzel text-xs font-bold text-gothic-text group-hover:text-gothic-gold transition-colors">{spell.name}</h5>
                              <p className="text-[8px] text-gothic-text/40 uppercase">{spell.type} • {spell.circle}º Círculo • {spell.cost} PM</p>
                            </div>
                            <button 
                              onClick={() => {
                                addSpell(spell);
                                triggerVFX('spell');
                              }} 
                              className="text-gothic-gold hover:text-white transition-colors"
                              title="Aprender Magia"
                            >
                              <Plus size={14}/>
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
                              triggerVFX('spell');
                            }
                          }}
                          disabled={state.currentPM < spell.cost}
                          className={cn(
                            "px-3 py-1 text-[10px] font-bold uppercase tracking-widest border transition-all",
                            state.currentPM >= spell.cost 
                              ? "bg-gothic-blue/20 border-gothic-blue text-gothic-blue hover:bg-gothic-blue hover:text-white" 
                              : "bg-gothic-red/10 border-gothic-red/20 text-gothic-red/40 cursor-not-allowed"
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
          )}

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
              
              <p className="font-cinzel text-[10px] md:text-sm text-gothic-gold tracking-widest uppercase mb-2 text-gothic-gold">Resultado Total</p>
              <h2 className={cn(
                "font-cinzel text-6xl md:text-8xl font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                rollData.isCritical ? "text-gothic-red" : rollData.isFail ? "text-gray-500" : "text-white"
              )}>
                {rollData.result}
              </h2>
              <p className="text-gothic-text/40 text-[10px] md:text-xs mt-4 font-mono">
                1d20 + {rollData.bonus}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* --- Roll Log Sidebar --- */}
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
