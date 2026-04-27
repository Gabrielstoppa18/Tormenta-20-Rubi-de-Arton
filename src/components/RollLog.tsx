import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Skull, Sparkles, Sword, Shield, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Roll } from '../types/database';

interface RollLogProps {
  rolls: Roll[];
  onClose?: () => void;
}

export function RollLog({ rolls, onClose }: RollLogProps) {
  return (
    <div className="flex flex-col h-full bg-black/40 border-l border-gothic-gold/10 backdrop-blur-md">
      <header className="p-4 border-b border-gothic-gold/10 flex justify-between items-center bg-black/60">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-gothic-gold" />
          <h3 className="font-cinzel text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Crônicas de Arthon</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gothic-text/40 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-tighter">
            Fechar
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto gothic-scroll p-4 space-y-4">
        <AnimatePresence initial={false}>
          {rolls.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
              <Skull size={32} className="mb-2" />
              <p className="font-cinzel text-[10px] uppercase tracking-widest">O silêncio domina o campo de batalha...</p>
            </div>
          ) : (
            rolls.map((roll) => (
              <motion.div
                key={roll.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-3 border-l-2 bg-gothic-card/20 relative group",
                  roll.is_critical ? "border-gothic-gold bg-gothic-gold/5" : 
                  roll.is_fail ? "border-gothic-red bg-gothic-red/5" : "border-gothic-gold/20"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-bold text-gothic-gold uppercase tracking-tighter truncate max-w-[120px]">
                    {roll.character_name}
                  </span>
                  <span className="text-[8px] text-gothic-text/20 font-mono">
                    {roll.created_at?.toDate ? new Date(roll.created_at.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1">
                    <p className="text-[10px] text-gothic-text/60 uppercase tracking-widest leading-none">
                      {roll.label}
                    </p>
                  </div>
                  <div className={cn(
                    "font-cinzel text-lg font-bold",
                    roll.is_critical ? "text-gothic-gold drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]" : 
                    roll.is_fail ? "text-gothic-red" : "text-white"
                  )}>
                    {roll.result}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[8px] text-gothic-text/30 font-mono">
                  <span>1d20</span>
                  <span>{roll.bonus >= 0 ? `+${roll.bonus}` : roll.bonus}</span>
                  {roll.is_critical && <Sparkles size={8} className="text-gothic-gold ml-1" />}
                  {roll.is_fail && <Skull size={8} className="text-gothic-red ml-1" />}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
