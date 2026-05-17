import React from 'react';
import { Sidebar } from './Sidebar';
import { ProfileAutoSync } from '../auth/ProfileAutoSync';
import { useSidebar } from '@/src/contexts/SidebarContext';
import { cn } from '@/src/lib/utils';
import { useLocation } from 'react-router-dom';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell = ({ children }: ShellProps) => {
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-studelle-burgundy-dark flex relative">
      <ProfileAutoSync />
      {/* Dynamic Background Noise/Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-pattern fixed" />
      
      {/* Sidebar - Precision Pushed Layout */}
      <Sidebar />

      <main className={cn(
        "flex-1 relative z-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-x-hidden",
        isCollapsed ? "ml-24" : "ml-24 md:ml-72",
        "pt-24 md:pt-10 px-6 md:px-10" 
      )}>
        {children}
      </main>
    </div>
  );
};
