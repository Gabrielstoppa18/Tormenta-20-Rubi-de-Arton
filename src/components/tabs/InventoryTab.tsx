import React, { useState } from 'react';
import { Backpack, PlusCircle, Plus, Minus, Trash2, Settings, Sword, Shield, Coins } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useCharacter, T20InventoryItem } from '../../context/CharacterContext';
import { ITEMS } from '../../data/t20-data';

// --- InventoryItem card ---

interface ItemCardProps {
  item: T20InventoryItem;
  onUpdate: (updates: Partial<T20InventoryItem>) => void;
  onRemove: () => void;
  onToggleEquip: () => void;
}

function ItemCard({ item, onUpdate, onRemove, onToggleEquip }: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isEquippable = item.type.includes('Arma') || item.type.includes('Armadura') || item.type.includes('Escudo');

  const getIcon = () => {
    const lower = item.type.toLowerCase();
    if (lower.includes('arma')) return <Sword size={14} className={cn(item.isEquipped ? 'text-gothic-bg' : 'text-gothic-gold/60')} />;
    if (lower.includes('armadura') || lower.includes('escudo')) return <Shield size={14} className={cn(item.isEquipped ? 'text-gothic-bg' : 'text-gothic-gold/60')} />;
    return <Backpack size={14} className="text-gothic-gold/60" />;
  };

  return (
    <div className={cn(
      'flex flex-col p-4 bg-gothic-card/40 border transition-all group',
      item.isEquipped ? 'border-gothic-gold shadow-[0_0_15px_rgba(191,155,48,0.1)]' : 'border-gothic-gold/10 hover:border-gothic-gold/30',
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={cn(
            'p-2 border transition-colors',
            item.isEquipped ? 'bg-gothic-gold border-gothic-gold' : 'bg-gothic-bg border-gothic-gold/10',
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
                'font-cinzel text-xs font-bold transition-colors',
                item.isEquipped ? 'text-gothic-gold' : 'text-gothic-text group-hover:text-gothic-gold',
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
                'px-2 py-0.5 text-[8px] font-bold uppercase tracking-tighter border transition-all',
                item.isEquipped
                  ? 'bg-gothic-gold border-gothic-gold text-gothic-bg'
                  : 'border-gothic-gold/30 text-gothic-gold hover:bg-gothic-gold/10',
              )}
            >
              {item.isEquipped ? 'Equipado' : 'Equipar'}
            </button>
          )}
          <button onClick={() => setIsEditing(!isEditing)} className="text-gothic-gold/40 hover:text-gothic-gold transition-colors">
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
            <button onClick={() => onUpdate({ quantity: Math.max(0, item.quantity - 1) })} className="p-1 text-gothic-gold/60 hover:text-gothic-gold">
              <Minus size={10} />
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 0 })}
              className="w-8 bg-transparent text-center text-xs font-bold font-cinzel text-gothic-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button onClick={() => onUpdate({ quantity: item.quantity + 1 })} className="p-1 text-gothic-gold/60 hover:text-gothic-gold">
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
}

// --- InventoryTab ---

export function InventoryTab() {
  const { state, cargaMaxima, cargaAtual, addItem, updateItem, toggleEquip, removeItem, setTibar } = useCharacter();

  const [showAddItem, setShowAddItem] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState<string | null>(null);

  const allItemTypes = Array.from(new Set(Object.values(ITEMS).map(i => i.type))).sort();

  const filteredItems = Object.values(ITEMS).filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(itemSearch.toLowerCase());
    const matchesType = !itemTypeFilter || item.type === itemTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <section className="bg-gothic-card p-8 border border-gothic-gold/10 animate-in fade-in duration-500">
      {/* Currency tracker */}
      <div className="flex items-center justify-between mb-6 p-4 bg-black/40 border border-gothic-gold/20">
        <div className="flex items-center gap-3">
          <span className="text-gothic-gold text-lg">⚙</span>
          <div>
            <p className="font-cinzel text-[9px] text-gothic-gold/50 uppercase tracking-widest">Tibares (T$)</p>
            <p className="text-[8px] text-gothic-text/30">Clique no valor para editar</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTibar(state.tibar - 1)}
            className="w-7 h-7 flex items-center justify-center border border-gothic-gold/20 text-gothic-gold/60 hover:text-gothic-gold hover:border-gothic-gold transition-colors"
          ><Minus size={12} /></button>
          <input
            type="number"
            value={state.tibar}
            onChange={e => setTibar(parseInt(e.target.value) || 0)}
            className="w-24 bg-transparent text-center font-cinzel text-xl font-bold text-gothic-gold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => setTibar(state.tibar + 1)}
            className="w-7 h-7 flex items-center justify-center border border-gothic-gold/20 text-gothic-gold/60 hover:text-gothic-gold hover:border-gothic-gold transition-colors"
          ><Plus size={12} /></button>
        </div>
      </div>

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
              {allItemTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2 gothic-scroll">
            {filteredItems.map(item => (
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
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encumbrance */}
      <div className="bg-black/40 p-6 border border-gothic-gold/10 space-y-4 mb-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h4 className="font-cinzel text-xs font-bold text-gothic-gold uppercase tracking-widest">Carga Total</h4>
            <p className="text-[10px] text-gothic-text/40 uppercase tracking-tighter">Capacidade Máxima: {cargaMaxima} kg</p>
          </div>
          <span className={cn('font-cinzel text-xl font-bold', cargaAtual > cargaMaxima ? 'text-gothic-red' : 'text-gothic-gold')}>
            {cargaAtual.toFixed(1)} / {cargaMaxima}
          </span>
        </div>
        <div className="h-1.5 bg-black/60 border border-gothic-gold/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (cargaAtual / cargaMaxima) * 100)}%` }}
            className={cn('h-full transition-colors duration-500', cargaAtual > cargaMaxima ? 'bg-gothic-red' : 'bg-gothic-gold')}
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
          <ItemCard
            key={item.id}
            item={item}
            onUpdate={(updates) => updateItem(item.id, updates)}
            onRemove={() => removeItem(item.id)}
            onToggleEquip={() => toggleEquip(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
