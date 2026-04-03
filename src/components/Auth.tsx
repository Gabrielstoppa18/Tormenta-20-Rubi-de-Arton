import React, { useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { Shield, Sword, Mail, Lock, UserPlus, LogIn, AlertCircle, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onSuccess: (user: any) => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      onSuccess(result.user);
    } catch (error: any) {
      console.error('Erro no login Google:', error);
      setError(`Erro ao entrar com Google: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        onSuccess(result.user);
      } else {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem!');
        }

        const result = await createUserWithEmailAndPassword(auth, email, password);
        onSuccess(result.user);
      }
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/email-already-in-use') message = 'Este e-mail já está em uso.';
      if (err.code === 'auth/invalid-credential') message = 'E-mail ou senha incorretos.';
      if (err.code === 'auth/weak-password') message = 'A senha deve ter pelo menos 6 caracteres.';
      setError(message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gothic-bg flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gothic-card border border-gothic-gold/20 p-12 text-center space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="space-y-2">
          <h1 className="font-cinzel text-4xl font-bold text-gothic-gold tracking-tighter">
            TORMENTA <span className="text-gothic-red">20</span>
          </h1>
          <p className="text-gothic-text/60 font-cinzel text-[10px] uppercase tracking-[0.3em]">
            Arthon Gothic Edition
          </p>
        </div>

        <div className="flex border-b border-gothic-gold/10">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 font-cinzel text-xs tracking-widest transition-all ${isLogin ? 'text-gothic-gold border-b-2 border-gothic-gold bg-gothic-gold/5' : 'text-gothic-text/40 hover:text-gothic-gold/60'}`}
          >
            ENTRAR
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 font-cinzel text-xs tracking-widest transition-all ${!isLogin ? 'text-gothic-gold border-b-2 border-gothic-gold bg-gothic-gold/5' : 'text-gothic-text/40 hover:text-gothic-gold/60'}`}
          >
            CADASTRAR
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest flex items-center gap-2">
              <Mail size={12} /> E-mail
            </label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
              placeholder="aventureiro@arthon.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} /> Senha
            </label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest flex items-center gap-2">
                <Lock size={12} /> Confirmar Senha
              </label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-sm text-gothic-text focus:border-gothic-gold outline-none transition-colors"
                placeholder="••••••••"
              />
            </motion.div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-3 bg-gothic-red/10 border border-gothic-red/30 text-gothic-red text-[10px] font-bold uppercase tracking-wider"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gothic-gold text-gothic-bg font-cinzel font-bold tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gothic-bg border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isLogin ? 'ENTRAR EM ARTHON' : 'FORJAR CONTA'}
              </>
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gothic-gold/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
            <span className="bg-gothic-card px-4 text-gothic-text/30">Ou continue com</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 border border-gothic-gold/20 text-gothic-gold hover:bg-gothic-gold/5 transition-all flex items-center justify-center gap-3 font-cinzel text-xs tracking-widest disabled:opacity-50"
        >
          <Chrome size={18} />
          ENTRAR COM GOOGLE
        </button>

        <div className="pt-4 space-y-4">
          <p className="text-[10px] text-gothic-text/30 uppercase tracking-widest">
            Desenvolvido para aventureiros de elite
          </p>
          
          <div className="p-2 bg-gothic-gold/5 border border-gothic-gold/20 text-[9px] text-gothic-gold/40 uppercase tracking-tighter">
            Firebase conectado. Verifique a aba "Authentication" no seu console Firebase.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
