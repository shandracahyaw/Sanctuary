import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardCheck, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  User as UserIcon,
  LogOut,
  Heart,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { useSidebar } from '@/src/contexts/SidebarContext';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Beranda', path: '/' },
  { icon: BookOpen, label: 'Kurikulum', path: '/kurikulum' },
  { icon: ClipboardCheck, label: 'Evaluasi Sesi', path: '/evaluasi' },
  { icon: FileSpreadsheet, label: 'KHS', path: '/khs' },
  { icon: FileText, label: 'Transkrip', path: '/transkrip' },
  { icon: Download, label: 'Unduhan', path: '/unduhan' },
  { icon: UserIcon, label: 'Profil', path: '/profil' },
];

export const Sidebar = ({ className }: { className?: string }) => {
  const { profile, logout, user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const displayName = profile?.displayName || user?.displayName || 'User';
  const photoURL = profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=064e3b&color=fff`;

  return (
    <aside className={cn(
      "bg-studelle-emerald inset-y-0 left-0 fixed flex flex-col p-6 z-50 transition-all duration-700 ease-in-out overflow-y-auto",
      isCollapsed ? "w-24 px-4 shadow-[10px_0_50px_rgba(0,0,0,0.5)]" : "w-72",
      className
    )}>
      <div className={cn(
        "flex items-center mb-12 px-2 transition-all",
        isCollapsed ? "justify-center" : "gap-4"
      )}>
        <div className="w-12 h-12 bg-studelle-accent rounded-[1.25rem] flex items-center justify-center text-white shrink-0 shadow-xl shadow-studelle-accent/30 scale-110">
          <Heart size={28} fill="currentColor" />
        </div>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="ml-2"
          >
            <h1 className="font-serif text-2xl font-bold text-white tracking-tight leading-none">Studelle</h1>
            <p className="text-[10px] text-white/40 tracking-[0.1em] font-medium mt-1">Management Academic</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 space-y-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.label : ""}
            className={({ isActive }) => 
              cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 cursor-pointer text-white/40 hover:text-white hover:bg-white/5",
                isCollapsed && "justify-center px-0",
                isActive && "text-white bg-studelle-accent shadow-2xl shadow-studelle-accent/40"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="text-sm font-bold tracking-widest whitespace-nowrap uppercase"
                  >
                    {item.label}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t border-white/10 space-y-6">
        <div className={cn(
          "flex items-center px-2 transition-all",
          isCollapsed ? "justify-center" : "gap-4"
        )}>
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/20 bg-white/5 shrink-0 shadow-lg">
            <img 
              src={photoURL} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <p className="text-[9px] text-white/30 tracking-wider">Mahasiswa Resmi</p>
            </motion.div>
          )}
        </div>

        <div className={cn(
          "flex items-center px-2 pt-2 transition-all",
          isCollapsed ? "flex-col gap-8" : "justify-between"
        )}>
          {/* Central UI/UX Interaction: Navigation arrow at bottom */}
          <button 
            onClick={toggleSidebar}
            className="w-14 h-14 rounded-[1.25rem] bg-white/10 flex items-center justify-center text-white hover:text-studelle-gold hover:bg-white/20 transition-all cursor-pointer shadow-2xl active:scale-90 group/toggle"
            title={isCollapsed ? "Buka Navigasi" : "Tutup Navigasi"}
          >
            <ChevronLeft size={28} className={cn("transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]", isCollapsed && "rotate-180")} />
          </button>
          
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className={cn(
              "text-white/30 hover:text-red-400 transition-all cursor-pointer p-4 rounded-2xl hover:bg-red-500/10 group/logout",
              isCollapsed && ""
            )}
            title="Keluar dari Sistem"
          >
            <LogOut size={24} className="group-hover/logout:scale-110 transition-transform duration-300" />
          </button>
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
              className="absolute inset-0 bg-studelle-emerald-dark/95 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="studelle-card p-12 max-w-lg w-full bg-studelle-cream border-studelle-emerald/10 relative z-10 space-y-10 text-center shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
               <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500 mx-auto shadow-inner">
                  <LogOut size={44} />
               </div>
               <div className="space-y-4">
                  <h3 className="text-4xl font-serif font-bold text-studelle-emerald italic">Ingin keluar dari sistem?</h3>
                  <p className="text-sm font-medium text-studelle-emerald/40 leading-relaxed uppercase tracking-widest px-8">
                    Pastikan semua data akademik anda telah tersinkronisasi sebelum meninggalkan portal.
                  </p>
               </div>
               <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 h-14 rounded-2xl border-2 border-studelle-emerald/10 text-studelle-emerald text-[10px] font-bold tracking-widest uppercase hover:bg-studelle-emerald/5 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={logout}
                    className="flex-1 h-14 rounded-2xl bg-studelle-emerald text-white text-[10px] font-bold tracking-widest uppercase hover:bg-studelle-accent shadow-xl shadow-studelle-emerald/20 transition-all flex items-center justify-center gap-3"
                  >
                    <span>Ya, Keluar Sekarang</span>
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </aside>
  );
};

