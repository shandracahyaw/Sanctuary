import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Heart, LogIn, ShieldCheck, UserPlus, Mail, Lock, User as UserIcon, Loader2, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Login = () => {
  const { loginWithGoogle, loginWithUsername, registerWithUsername, error } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isRegistering) {
      await registerWithUsername(formData.identifier, formData.password, formData.name);
    } else {
      await loginWithUsername(formData.identifier, formData.password);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-studelle-cream flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply bg-pattern" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-studelle-emerald/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-studelle-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl w-full relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 w-full overflow-hidden studelle-card p-0 border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-studelle-emerald">
          {/* Left Side: Branding */}
          <div className="p-12 md:p-20 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden group border-b md:border-b-0 md:border-r border-white/5">
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-pattern" />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8 flex flex-col items-center relative z-10"
            >
              <div className="w-28 h-28 bg-white/10 rounded-[2.5rem] flex items-center justify-center text-white mb-2 group-hover:scale-105 transition-transform duration-700 shadow-2xl shadow-black/20 backdrop-blur-sm border border-white/10">
                 <GraduationCap size={56} className="fill-white/10" strokeWidth={1.5} />
              </div>
              <div className="space-y-4 flex flex-col items-center">
                <h1 className="text-6xl md:text-7xl font-serif font-black uppercase tracking-tighter leading-none italic select-none">
                  Studelle
                </h1>
                <p className="text-[11px] font-bold tracking-[0.3em] text-white/50 uppercase leading-relaxed max-w-[360px] text-center mx-auto">
                  Student Development Learning<br />Evaluation Environment
                </p>
              </div>
            </motion.div>

            {/* Decorative base element */}
            <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-studelle-gold/5 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Right Side: Form Area */}
          <div className="p-10 md:p-20 flex flex-col justify-center space-y-10 relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-studelle-gold/20 to-transparent" />
            
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-bold italic text-studelle-gold">
                {isRegistering ? 'Buat Akun Baru' : 'Selamat Datang'}
              </h2>
              <p className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
                {isRegistering ? 'Lengkapi identitas akademik anda' : 'Akses gerbang akademik anda'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {isRegistering && (
                  <motion.div 
                    key="register-name"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="relative"
                  >
                    <UserIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                    <input 
                      required
                      type="text" 
                      placeholder="NAMA LENGKAP" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-black/20 border border-white/5 rounded-2xl px-12 py-4 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-studelle-gold/30 transition-all uppercase text-white"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  required
                  type="text" 
                  placeholder="EMAIL / USERNAME" 
                  value={formData.identifier}
                  onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl px-12 py-4 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-studelle-gold/30 transition-all uppercase text-white"
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  required
                  type="password" 
                  placeholder="PASSWORD" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl px-12 py-4 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-studelle-gold/30 transition-all text-white"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 text-red-400 p-4 rounded-xl text-[10px] font-bold tracking-widest uppercase border border-red-500/20 flex items-start gap-3 text-left"
                >
                  <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-studelle-gold text-studelle-emerald h-14 rounded-2xl text-[11px] font-black tracking-[0.4em] uppercase hover:bg-white hover:scale-[1.01] transition-all flex items-center justify-center gap-4 group active:scale-95 shadow-xl shadow-black/20 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />)}
                <span>{isRegistering ? 'KONFIRMASI DAFTAR' : 'MASUK SISTEM'}</span>
              </button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-[0.4em] text-white/10">
                <span className="bg-studelle-emerald px-4 italic">Social Authentication</span>
              </div>
            </div>

            <button 
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full border border-white/5 bg-white/5 text-white h-14 rounded-2xl text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-4 group active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" />
              <span>OTORITAS GOOGLE</span>
            </button>

            <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-6">
              
              <div className="flex items-center gap-2 opacity-20 hover:opacity-100 transition-opacity">
                 <ShieldCheck size={10} className="text-studelle-gold" />
                 <p className="text-[8px] font-bold text-white uppercase tracking-[0.3em]">
                   Secure Gateway Royale
                 </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
