import React from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { getIndonesianDate } from '@/src/lib/dateUtils';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface PageHeaderProps {
  title: string;
  showStatus?: boolean;
}

export const PageHeader = ({ title, showStatus = false }: PageHeaderProps) => {
  const { profile, user } = useAuth();
  const displayName = profile?.displayName || user?.displayName || 'User';
  const photoURL = profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8B1D3B&color=fff`;
  const today = getIndonesianDate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
      <div className="space-y-1">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-8 bg-studelle-accent rounded-full animate-pulse" />
          <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-studelle-cream">{title}</h2>
        </div>
        {profile?.currentPhaseLabel && (
          <p className="text-[10px] font-black tracking-[0.3em] text-[#FDFBD3] uppercase italic ml-5 opacity-90">
            {profile.currentPhaseLabel}
          </p>
        )}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 opacity-90 self-end md:self-auto"
      >
        <div className="text-right">
          <p className="text-sm font-serif font-bold tracking-wide text-studelle-cream">{displayName}</p>
          <p className="text-[10px] font-medium tracking-[0.15em] text-studelle-gold uppercase">{today}</p>
        </div>
        
        {showStatus ? (
          <ShieldCheck size={28} className="text-studelle-gold drop-shadow-md shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/20 bg-white/5 shrink-0 shadow-xl ring-2 ring-studelle-burgundy/20">
            <img 
              src={photoURL} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};
