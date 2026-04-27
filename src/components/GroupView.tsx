import React, { useState } from 'react';
import { Users, Plus, UserPlus, LogOut, Shield, Heart, Zap, Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { groupService } from '../lib/group';
import type { Group, Character } from '../types/database';

interface GroupViewProps {
  user: any;
  activeGroup: Group | null;
  myGroups: Group[];
  groupMembers: Character[];
  onSelectGroup: (group: Group) => void;
  onCreateGroup: (name: string) => void;
  onJoinGroup: (code: string) => void;
}

export function GroupView({ 
  user, 
  activeGroup, 
  myGroups, 
  groupMembers, 
  onSelectGroup, 
  onCreateGroup, 
  onJoinGroup 
}: GroupViewProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    if (activeGroup) {
      navigator.clipboard.writeText(activeGroup.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Groups List */}
        <aside className="w-full md:w-64 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-cinzel text-sm font-bold text-gothic-gold uppercase tracking-widest">Meus Grupos</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => { setShowCreate(true); setShowJoin(false); }}
                className="text-gothic-gold hover:text-white transition-colors"
                title="Criar Grupo"
              >
                <Plus size={16} />
              </button>
              <button 
                onClick={() => { setShowJoin(true); setShowCreate(false); }}
                className="text-gothic-gold hover:text-white transition-colors"
                title="Entrar em Grupo"
              >
                <UserPlus size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {myGroups.map(group => (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className={cn(
                  "w-full text-left p-4 border transition-all group",
                  activeGroup?.id === group.id 
                    ? "bg-gothic-gold/10 border-gothic-gold text-gothic-gold" 
                    : "bg-black/20 border-gothic-gold/10 text-gothic-text/60 hover:border-gothic-gold/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <Users size={16} className={activeGroup?.id === group.id ? "text-gothic-gold" : "text-gothic-text/20"} />
                  <span className="font-cinzel text-xs font-bold uppercase tracking-widest truncate">{group.name}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Active Group View */}
        <main className="flex-1">
          {showCreate ? (
            <div className="bg-gothic-card p-4 md:p-8 border border-gothic-gold/20 space-y-6">
              <h3 className="font-cinzel text-lg md:text-xl text-gothic-gold uppercase">Fundar Novo Grupo</h3>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Nome da Aliança</label>
                <input 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Os Cavaleiros de Arthon"
                  className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => { onCreateGroup(groupName); setGroupName(''); setShowCreate(false); }}
                  className="flex-1 py-3 bg-gothic-gold text-gothic-bg font-cinzel font-bold uppercase tracking-widest hover:bg-white transition-all"
                >
                  Confirmar Fundação
                </button>
                <button 
                  onClick={() => setShowCreate(false)}
                  className="px-6 py-3 border border-gothic-gold/20 text-gothic-gold/60 font-cinzel font-bold uppercase tracking-widest hover:bg-gothic-gold/10"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : showJoin ? (
            <div className="bg-gothic-card p-4 md:p-8 border border-gothic-gold/20 space-y-6">
              <h3 className="font-cinzel text-lg md:text-xl text-gothic-gold uppercase">Entrar em Aliança</h3>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">Código de Convite</label>
                <input 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="CÓDIGO"
                  className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none text-center tracking-[0.5em] uppercase"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => { onJoinGroup(inviteCode); setShowJoin(false); }}
                  className="flex-1 py-3 bg-gothic-gold text-gothic-bg font-cinzel font-bold uppercase tracking-widest hover:bg-white transition-all"
                >
                  Entrar no Grupo
                </button>
                <button 
                  onClick={() => setShowJoin(false)}
                  className="px-6 py-3 border border-gothic-gold/20 text-gothic-gold/60 font-cinzel font-bold uppercase tracking-widest hover:bg-gothic-gold/10"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : activeGroup ? (
            <div className="space-y-8">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gothic-card p-4 md:p-6 border border-gothic-gold/10">
                <div>
                  <h2 className="font-cinzel text-xl md:text-2xl font-bold text-gothic-gold uppercase tracking-widest">{activeGroup.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 mt-1">
                    <p className="text-[9px] md:text-[10px] text-gothic-text/40 uppercase tracking-widest">
                      {activeGroup.members.length} Membros • Fundado em {new Date(activeGroup.created_at?.toDate()).toLocaleDateString()}
                    </p>
                    <button 
                      onClick={copyInvite}
                      className="flex items-center gap-1 text-[9px] md:text-[10px] text-gothic-gold hover:text-white transition-colors uppercase font-bold"
                    >
                      {copied ? <Check size={10} /> : <Copy size={10} />}
                      {activeGroup.invite_code}
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => groupService.leaveGroup(activeGroup.id, user.uid)}
                  className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-gothic-red/60 hover:text-gothic-red transition-colors uppercase tracking-widest"
                >
                  <LogOut size={14} /> Sair do Grupo
                </button>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {groupMembers.map(member => (
                  <motion.div 
                    key={member.id}
                    layout
                    className="bg-gothic-card p-4 md:p-6 border border-gothic-gold/10 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gothic-gold/20 group-hover:bg-gothic-gold transition-colors" />
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className="w-12 h-12 md:w-16 md:h-16 border border-gothic-gold/20 p-1 bg-black/40 flex-shrink-0">
                        <img 
                          src={`https://picsum.photos/seed/${member.name}/200/200`} 
                          alt={member.name} 
                          className="w-full h-full object-cover grayscale"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-cinzel text-base md:text-lg font-bold text-gothic-gold truncate">{member.name}</h4>
                        <p className="text-[9px] md:text-[10px] text-gothic-text/40 uppercase tracking-widest truncate">Nível {member.level} • {member.class_id}</p>
                        
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
                              <span className="text-gothic-red">Vida</span>
                              <span className="text-gothic-text">{member.current_hp}</span>
                            </div>
                            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gothic-red transition-all duration-500" 
                                style={{ width: `${Math.min(100, (member.current_hp || 0) / (member.level * 10) * 100)}%` }} 
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
                              <span className="text-gothic-blue">Mana</span>
                              <span className="text-gothic-text">{member.current_mp}</span>
                            </div>
                            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gothic-blue transition-all duration-500" 
                                style={{ width: `${Math.min(100, (member.current_mp || 0) / (member.level * 5) * 100)}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gothic-gold/10 p-6 md:p-12 text-center">
              <Users size={48} className="text-gothic-gold/20 mb-4" />
              <h3 className="font-cinzel text-lg md:text-xl text-gothic-gold/40 uppercase">Nenhuma Aliança Ativa</h3>
              <p className="text-gothic-text/30 text-xs md:text-sm mt-2 max-w-sm">
                Crie um novo grupo ou entre em um existente usando um código de convite para compartilhar sua jornada.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button 
                  onClick={() => setShowCreate(true)}
                  className="px-8 py-3 bg-gothic-gold/10 border border-gothic-gold/30 text-gothic-gold font-cinzel font-bold uppercase tracking-widest hover:bg-gothic-gold hover:text-gothic-bg transition-all"
                >
                  Fundar Grupo
                </button>
                <button 
                  onClick={() => setShowJoin(true)}
                  className="px-8 py-3 border border-gothic-gold/20 text-gothic-gold/60 font-cinzel font-bold uppercase tracking-widest hover:bg-gothic-gold/10 transition-all"
                >
                  Entrar em Grupo
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
