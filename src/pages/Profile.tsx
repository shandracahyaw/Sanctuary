import React, { useState, useRef } from 'react';
import { Save, User as UserIcon, ShieldCheck, Loader2, LogOut, Camera, Heart } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { saveUserProfile } from '@/src/services/firestoreService';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '@/src/components/ui/PageHeader';

const Profile = () => {
  const { user, username, userId, profile, refreshProfile, logout, setProfileState } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    nim: profile?.nim || '',
    faculty: profile?.faculty || '',
    programStudy: profile?.programStudy || '',
    username: profile?.username || '',
    semester: profile?.semester || 1,
    status: profile?.status || 'Aktif',
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        nim: profile.nim || '',
        faculty: profile.faculty || '',
        programStudy: profile.programStudy || '',
        username: profile.username || '',
        semester: profile.semester || 1,
        status: profile.status || 'Aktif',
      });
    }
  }, [profile]);

  const handleSave = async (customProfile?: any) => {
    if (!userId) return;
    
    // Check if customProfile is an event object (common when called via onClick)
    const isEvent = customProfile && (customProfile.nativeEvent || customProfile.currentTarget);
    const profileData = isEvent ? null : customProfile;
    
    setSubmitting(true);
    
    // Immediate state update for "instant" feel
    const profileToSave = profileData || { ...profile, ...formData };
    setProfileState(profileToSave);
    
    try {
      await saveUserProfile(userId, profileToSave);
      await refreshProfile();
      setTempPhoto(null);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (Firestore limit is 1MB for whole doc, keep image small)
      if (file.size > 800000) {
        alert('Foto terlalu besar. Silakan pilih foto di bawah 800KB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setTempPhoto(base64String);
        
        // Auto-save the image update
        const updatedProfile = { 
          ...profile, 
          ...formData,
          photoURL: base64String 
        };
        handleSave(updatedProfile);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12 pb-20 pt-6">
      <PageHeader title="Profil Pengguna" showStatus />

      {/* Main Profile Info Card */}
      <div className="studelle-card p-12 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden ring-1 ring-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
        <div className="relative group">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div 
            onClick={handleImageClick}
            className="w-52 h-52 rounded-[3.5rem] bg-studelle-burgundy-dark p-1.5 overflow-hidden shadow-2xl rotate-2 transition-transform group-hover:rotate-0 duration-700 cursor-pointer"
          >
            <img 
              src={tempPhoto || profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || 'User')}&background=2D0B13&color=fff`} 
              alt="Profile" 
              className="w-full h-full object-cover rounded-[3.2rem]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-studelle-burgundy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              {submitting ? <Loader2 size={36} className="text-white animate-spin" /> : <Camera size={36} className="text-white" />}
            </div>
          </div>
          <div 
            onClick={handleImageClick}
            className="absolute -bottom-2 -right-2 bg-studelle-accent text-white p-3.5 rounded-2xl shadow-xl z-10 cursor-pointer hover:scale-110 transition-transform active:scale-95"
          >
             <Camera size={24} />
          </div>
        </div>

        <div className="flex-1 space-y-8 text-center md:text-left">
           <div className="space-y-4">
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                 <span className="bg-studelle-burgundy text-white px-5 py-2 rounded-xl text-[10px] font-bold tracking-widest">Mahasiswa Resmi</span>
                 <span className="border border-studelle-burgundy/10 px-5 py-2 rounded-xl text-[10px] font-bold tracking-widest text-studelle-burgundy opacity-50">NIM #{profile?.nim}</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-studelle-burgundy tracking-tight">
                {profile?.displayName}
              </h1>
              {username && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                  Metode Login: Username Lokal
                </div>
              )}
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniStat label="Status" value={profile?.status} />
              <MiniStat label="Semester" value={profile?.semester} />
              <MiniStat label="Fakultas" value={profile?.faculty || '-'} />
              <MiniStat label="Program Studi" value={profile?.programStudy || '-'} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Update Form */}
        <div className="lg:col-span-2 studelle-card p-12 space-y-12 shadow-2xl">
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-studelle-burgundy text-white rounded-2xl flex items-center justify-center shadow-lg">
                 <UserIcon size={24} />
              </div>
              <div>
                 <h3 className="text-3xl font-serif font-bold text-studelle-burgundy leading-none">Sinkronisasi Identitas</h3>
                 <p className="text-sm font-medium tracking-wide text-studelle-burgundy/40 mt-2">Perbarui Informasi Profil Secara Real-time</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <InputGroup label="Nama Lengkap" value={formData.displayName} onChange={(v) => setFormData({...formData, displayName: v})} />
              <InputGroup label="Username" value={formData.username} onChange={(v) => setFormData({...formData, username: v})} />
              <InputGroup label="Nomor Induk Mahasiswa (NIM)" value={formData.nim} onChange={(v) => setFormData({...formData, nim: v})} />
              <InputGroup label="Fakultas" value={formData.faculty} onChange={(v) => setFormData({...formData, faculty: v})} />
              <InputGroup label="Program Studi" value={formData.programStudy} onChange={(v) => setFormData({...formData, programStudy: v})} />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                   <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Semester</label>
                   <select 
                     value={formData.semester}
                     onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}
                     className="studelle-input appearance-none bg-studelle-cream border-studelle-burgundy/5"
                   >
                     {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Status Akademik</label>
                   <select 
                     value={formData.status}
                     onChange={(e) => setFormData({...formData, status: e.target.value})}
                     className="studelle-input appearance-none bg-studelle-cream border-studelle-burgundy/5"
                   >
                     <option>Aktif</option>
                     <option>Cuti</option>
                     <option>Non-Aktif</option>
                   </select>
                </div>
              </div>
           </div>

           <div className="pt-12 border-t border-studelle-burgundy/5 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={submitting}
                className="studelle-button w-full md:w-auto h-14 px-12"
              >
                 {submitting ? <Loader2 size={24} className="animate-spin" /> : "Simpan Perubahan"}
              </button>
           </div>
        </div>

        {/* Account Settings */}
        <div className="flex flex-col gap-8">
           <div className="studelle-card p-10 space-y-8 bg-studelle-burgundy text-white group cursor-pointer hover:bg-studelle-accent transition-all duration-700 overflow-hidden relative border-none shadow-2xl">
              <ShieldCheck size={140} className="absolute -bottom-12 -right-12 opacity-10 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 space-y-6">
                 <h4 className="text-3xl font-serif font-bold leading-tight">Keamanan Akun</h4>
                 <p className="text-sm font-medium text-white/50 leading-relaxed">
                   Kelola kredensial dan otentikasi untuk melindungi data akademik anda secara aman.
                 </p>
                 <button className="text-xs font-bold tracking-widest border-b border-white/20 pb-1 mt-4 group-hover:border-white transition-all uppercase">Kelola Keamanan</button>
              </div>
           </div>

           <div className="studelle-card p-10 space-y-8 border-studelle-burgundy/10 flex flex-col justify-between shadow-xl">
              <div className="space-y-4">
                 <h4 className="text-3xl font-serif font-bold text-studelle-burgundy">Logout</h4>
                 <p className="text-sm font-medium text-studelle-burgundy/40 leading-relaxed">
                   Selesaikan sesi akademik saat ini dan amankan portal anda.
                 </p>
              </div>
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-center gap-4 h-14 rounded-2xl border-2 border-studelle-burgundy text-studelle-burgundy text-xs font-bold tracking-widest hover:bg-studelle-burgundy hover:text-white transition-all duration-300"
              >
                 <LogOut size={20} />
                 <span>Keluar dari Sistem</span>
              </button>
           </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-studelle-burgundy-dark/95 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="studelle-card p-12 max-w-lg w-full bg-studelle-cream border-studelle-burgundy/10 relative z-10 space-y-10 text-center shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
               <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500 mx-auto shadow-inner">
                  <LogOut size={44} />
               </div>
               <div className="space-y-4">
                  <h3 className="text-4xl font-serif font-bold text-studelle-burgundy italic">Selesaikan Sesi Ini?</h3>
                  <p className="text-sm font-medium text-studelle-burgundy/40 leading-relaxed uppercase tracking-widest px-8">
                    Portal akademik anda akan terkunci secara otomatis setelah anda keluar.
                  </p>
               </div>
               <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 h-14 rounded-2xl border-2 border-studelle-burgundy/10 text-studelle-burgundy text-[10px] font-bold tracking-widest uppercase hover:bg-studelle-burgundy/5 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={logout}
                    className="flex-1 h-14 rounded-2xl bg-studelle-burgundy text-white text-[10px] font-bold tracking-widest uppercase hover:bg-studelle-accent shadow-xl shadow-studelle-burgundy/20 transition-all flex items-center justify-center gap-3"
                  >
                    <span>Ya, Saya Ingin Keluar</span>
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="pt-12 border-t border-white/5 text-center">
        <p className="text-[11px] font-medium tracking-[0.1em] text-white/20">
          Studelle Royale Sanctuary © 2026 — Semua rincian profil telah dienkripsi secara aman
        </p>
      </footer>
    </div>

  );
};

const MiniStat = ({ label, value }: { label: string, value: string | number }) => (
  <div className="bg-studelle-burgundy/5 p-3 rounded-2xl border border-studelle-burgundy/5">
     <p className="text-[8px] font-black text-studelle-burgundy opacity-30 uppercase tracking-widest">{label}</p>
     <p className="text-xs font-serif font-black italic text-studelle-burgundy mt-1 truncate">{value}</p>
  </div>
);

const InputGroup = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="space-y-2">
     <label className="text-[9px] font-bold tracking-widest text-studelle-burgundy/40 uppercase ml-2 italic">{label}</label>
     <input 
       type="text" 
       value={value}
       onChange={(e) => onChange(e.target.value)}
       className="studelle-input"
     />
  </div>
);

export default Profile;
