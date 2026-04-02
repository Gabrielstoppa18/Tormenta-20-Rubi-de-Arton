/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Settings,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useCharacter } from './context/CharacterContext';
import { CLASSES, RACES, POWERS, SPELLS, DEITIES, ITEMS, SKILLS_ATTRIBUTES } from './data/t20-data';
import { calculateSkill } from './lib/t20-logic';

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

const InventoryItem = ({ name, type, weight, cost, onRemove }: { key?: React.Key; name: string; type: string; weight: number; cost: string; onRemove: () => void }) => {
  const getIcon = () => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('arma')) return <Sword size={14} className="text-gothic-gold/60" />;
    if (lowerType.includes('armadura') || lowerType.includes('escudo')) return <Shield size={14} className="text-gothic-gold/60" />;
    return <Backpack size={14} className="text-gothic-gold/60" />;
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gothic-card/40 border border-gothic-gold/10 hover:border-gothic-gold/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gothic-bg border border-gothic-gold/10">
          {getIcon()}
        </div>
        <div>
          <h5 className="font-cinzel text-xs font-bold text-gothic-text">{name}</h5>
          <p className="text-[9px] text-gothic-text/40 uppercase tracking-tighter">{type} • {weight}kg • {cost}</p>
        </div>
      </div>
      <button onClick={onRemove} className="text-gothic-red/40 hover:text-gothic-red transition-colors">
        <Minus size={14} />
      </button>
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
    removeItem,
    levelUp,
    levelDown
  } = useCharacter();

  const [activeTab, setActiveTab] = useState<'geral' | 'combate' | 'pericias' | 'inventario' | 'grimorio'>('geral');
  const [rollData, setRollData] = useState<{ result: number; bonus: number; isCritical: boolean } | null>(null);
  const [showAddPower, setShowAddPower] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddSpell, setShowAddSpell] = useState(false);

  const handleRoll = (bonus: number) => {
    const natural = Math.floor(Math.random() * 20) + 1;
    setRollData({
      result: natural + bonus,
      bonus: bonus,
      isCritical: natural === 20
    });
    setTimeout(() => setRollData(null), 4000);
  };

  const tabs = [
    { id: 'geral', label: 'Geral', icon: <User size={18} /> },
    { id: 'combate', label: 'Combate', icon: <Sword size={18} /> },
    { id: 'pericias', label: 'Perícias', icon: <Star size={18} /> },
    { id: 'inventario', label: 'Inventário', icon: <Backpack size={18} /> },
    { id: 'grimorio', label: 'Grimório', icon: <Book size={18} /> },
  ] as const;

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

        <nav className="flex-1 px-4 space-y-2">
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

        <div className="p-6 border-t border-gothic-gold/5 bg-gothic-card/20">
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
              <p className="text-[10px] text-gothic-gold/60 italic truncate">{state.race} {state.class}</p>
            </div>
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
                onClick={levelUp}
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
                      {Object.keys(RACES).map(r => <option key={r} value={r} className="bg-gothic-card">{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Classe</label>
                    <select 
                      value={state.class} 
                      onChange={(e) => setClass(e.target.value)}
                      className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
                    >
                      {Object.keys(CLASSES).map(c => <option key={c} value={c} className="bg-gothic-card">{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Divindade</label>
                    <select 
                      value={state.deity} 
                      onChange={(e) => setDeity(e.target.value)}
                      className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
                    >
                      {Object.keys(DEITIES).map(d => <option key={d} value={d} className="bg-gothic-card">{d}</option>)}
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
                    <div key={power.name} className="p-4 bg-gothic-card/40 border border-gothic-gold/10 relative group">
                      <button 
                        onClick={() => removePower(power.name)}
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
                              onClick={() => handleRoll(bonus)}
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
                    <Shield size={80} className="text-gothic-gold/20" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-gothic-text/40 uppercase tracking-widest">Defesa</span>
                      <p className="font-cinzel text-5xl font-bold text-gothic-gold leading-none">{defesa}</p>
                    </div>
                  </div>
                  <div className="w-full pt-6 border-t border-gothic-gold/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gothic-text/40 uppercase">Bônus Manual</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setDefenseBonus(state.defenseBonus - 1)} className="text-gothic-gold/60 hover:text-gothic-gold"><Minus size={12}/></button>
                        <span className="font-cinzel text-sm text-gothic-text">{state.defenseBonus}</span>
                        <button onClick={() => setDefenseBonus(state.defenseBonus + 1)} className="text-gothic-gold/60 hover:text-gothic-gold"><Plus size={12}/></button>
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
                    )} onClick={() => handleRoll(bonus)}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.inventory.map((itemName, idx) => {
                  const item = ITEMS[itemName];
                  if (!item) return null;
                  return (
                    <InventoryItem 
                      key={`${itemName}-${idx}`}
                      name={item.name}
                      type={item.type}
                      weight={item.weight}
                      cost={item.cost}
                      onRemove={() => removeItem(itemName)}
                    />
                  );
                })}
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
                        <button onClick={() => addSpell(spell)} className="text-gothic-gold hover:text-white"><Plus size={14}/></button>
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
        </div>
      </main>

      {/* --- Roll Result Modal --- */}
      <AnimatePresence>
        {rollData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[60] bg-black/80 backdrop-blur-sm"
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
              <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-gothic-gold" />
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-gothic-gold" />
              
              <p className="font-cinzel text-sm text-gothic-gold tracking-widest uppercase mb-2 text-gothic-gold">Resultado Total</p>
              <h2 className={cn(
                "font-cinzel text-8xl font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]",
                rollData.isCritical ? "text-gothic-red" : "text-white"
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
