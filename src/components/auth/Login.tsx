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
    <div className="min-h-screen bg-studelle-cream flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply bg-pattern" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-studelle-emerald/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-studelle-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full relative z-10"
      >
        <div className="studelle-card overflow-hidden bg-studelle-emerald text-white border-none shadow-2xl relative group">
          <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-pattern" />
          
          <div className="p-10 md:p-14 flex flex-col items-center text-center space-y-12">
            {/* Branding Header Area */}
            <div className="space-y-6 flex flex-col items-center">
              <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform duration-700 shadow-2xl shadow-black/20">
                 <Heart size={48} className="fill-white" />
              </div>
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-serif font-black uppercase tracking-tighter leading-none italic select-none">
                  Studelle
                </h1>
                <p className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase leading-relaxed max-w-[240px]">
                  Secure Academic Environment
                </p>
              </div>
            </div>

            {/* Form Area */}
            <div className="w-full space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold italic text-studelle-gold">
                  {isRegistering ? 'Buat Akun Baru' : 'Selamat Datang'}
                </h2>
                <p className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
                  {isRegistering ? 'Lengkapi identitas anda' : 'Akses kredensial anda'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {isRegistering && (
                    <motion.div 
                      key="register-name"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative"
                    >
                      <UserIcon size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
                      <input 
                        required
                        type="text" 
                        placeholder="NAMA LENGKAP" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-studelle-gold/30 transition-all uppercase"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input 
                    required
                    type="text" 
                    placeholder="EMAIL / USERNAME" 
                    value={formData.identifier}
                    onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-studelle-gold/30 transition-all uppercase"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input 
                    required
                    type="password" 
                    placeholder="PASSWORD" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold tracking-wider placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-studelle-gold/30 transition-all"
                  />
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black/20 text-studelle-gold p-4 rounded-xl text-[10px] font-bold tracking-widest uppercase border border-white/5 flex items-start gap-3 text-left"
                  >
                    <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-studelle-gold text-studelle-emerald h-14 rounded-2xl text-[10px] font-black tracking-[0.4em] uppercase hover:bg-white hover:scale-[1.02] transition-all flex items-center justify-center gap-4 group active:scale-95 shadow-2xl shadow-black/20 mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />)}
                  <span>{isRegistering ? 'KONFIRMASI DAFTAR' : 'MASUK SISTEM'}</span>
                </button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <div className="relative flex justify-center text-[8px] uppercase font-bold tracking-[0.4em] text-white/20">
                  <span className="bg-studelle-emerald px-4 italic">Social Authentication</span>
                </div>
              </div>

              <button 
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full border border-white/10 bg-white/5 text-white h-14 rounded-2xl text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-4 group active:scale-95"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" />
                <span>OTORITAS GOOGLE</span>
              </button>

              <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-6">
                <button 
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] hover:text-studelle-gold transition-colors"
                >
                  {isRegistering ? 'Sudah memiliki akun? Masuk' : 'Belum memiliki akun? Daftar Disini'}
                </button>
                <div className="space-y-1">
                  <p className="text-[7px] font-bold text-white/10 uppercase tracking-[0.5em] select-none">
                    Royale Secure Gateway v4.5.1
                  </p>
                  <p className="text-[7px] font-bold text-studelle-gold/20 uppercase tracking-[0.2em]">
                    Private personal edition
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
