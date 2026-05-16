import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Heart, LogIn, ShieldCheck, UserPlus, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-studelle-burgundy-dark flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-pattern" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-studelle-burgundy/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-studelle-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl w-full relative z-10"
      >
        <div className="studelle-card overflow-hidden bg-white/60 backdrop-blur-xl border-white/40 shadow-2xl relative group grid md:grid-cols-2">
          {/* Left Grid: Branding */}
          <div className="relative p-10 md:p-16 flex flex-col items-center justify-center bg-studelle-burgundy text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-pattern" />
            
            <div className="relative z-10 space-y-6 text-left">
              <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-500">
                 <Heart size={40} className="fill-white" />
              </div>
              <h1 className="text-6xl md:text-7xl font-serif font-black uppercase tracking-tighter leading-none italic select-none">
                Studelle
              </h1>
              <p className="text-xs font-bold tracking-[0.2em] text-white/60 uppercase md:max-w-[280px] leading-relaxed">
                Student Development Learning Evaluation Environment
              </p>
            </div>
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-studelle-gold/20 rounded-full -ml-16 -mb-16 blur-2xl" />
          </div>

          {/* Right Grid: Form */}
          <div className="p-10 md:p-16 flex flex-col justify-center space-y-10 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-studelle-burgundy via-studelle-gold to-studelle-accent md:hidden" />
            
            <div className="space-y-2">
              <h2 className="text-4xl font-serif font-bold italic text-studelle-burgundy">
                Selamat Datang
              </h2>
              <p className="text-sm font-medium text-studelle-burgundy/60">
                Silakan masukkan email dan password anda
              </p>
            </div>

            <div className="w-full space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <AnimatePresence mode="wait">
                  {isRegistering && (
                    <motion.div 
                      key="register-name"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="relative">
                        <UserIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-studelle-burgundy/30" />
                        <input 
                          required
                          type="text" 
                          placeholder="Nama Lengkap" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="studelle-input pl-12 h-14"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-studelle-burgundy/30" />
                  <input 
                    required
                    type="text" 
                    placeholder="Email atau Username" 
                    value={formData.identifier}
                    onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                    className="studelle-input pl-12 h-14"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-studelle-burgundy/30" />
                  <input 
                    required
                    type="password" 
                    placeholder="Password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="studelle-input pl-12 h-14"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-900/70 p-4 rounded-xl text-[10px] font-bold tracking-widest uppercase border border-red-100 flex items-start gap-3">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-studelle-burgundy text-white h-14 rounded-2xl text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-studelle-burgundy-dark transition-all flex items-center justify-center gap-4 group active:scale-95 shadow-xl shadow-studelle-burgundy/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />)}
                  <span>{isRegistering ? 'Daftar Sekarang' : 'Masuk Sistem'}</span>
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-studelle-burgundy/5"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em] text-studelle-burgundy/30">
                  <span className="bg-white/40 backdrop-blur-sm px-4 italic">Atau Login Alternatif</span>
                </div>
              </div>

              <button 
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full border-2 border-studelle-burgundy/10 bg-white/40 text-studelle-burgundy h-14 rounded-2xl text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-white transition-all flex items-center justify-center gap-4 group active:scale-95"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" />
                <span>Otoritas Google</span>
              </button>

              <div className="pt-6 border-t border-studelle-burgundy/5 space-y-4">
                <button 
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-[10px] font-bold text-studelle-burgundy/40 uppercase tracking-widest hover:text-studelle-accent transition-colors"
                >
                  {isRegistering ? 'Sudah memiliki akun? Masuk' : 'Belum memiliki akun? Daftar Disini'}
                </button>
                <p className="text-[8px] font-bold text-studelle-burgundy/15 uppercase tracking-[0.4em] select-none text-center">
                  Royale Secure Gateway Protocol v4.5.1
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
