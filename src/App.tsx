/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { SidebarProvider } from '@/src/contexts/SidebarContext';
import { Login } from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import Curriculum from './pages/Curriculum';
import SessionEvaluation from './pages/SessionEvaluation';
import GradeCard from './pages/GradeCard';
import Transcript from './pages/Transcript';
import Downloads from './pages/Downloads';
import Profile from './pages/Profile';

const AppContent = () => {
  const { userId, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-studelle-cream flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 mix-blend-multiply bg-pattern pointer-events-none" />
        <div className="space-y-8 flex flex-col items-center relative z-10">
          <div className="w-16 h-16 border-4 border-studelle-burgundy/5 border-t-studelle-burgundy rounded-full animate-[spin_0.6s_linear_infinite]" />
          <div className="text-center animate-pulse">
            <h2 className="text-3xl font-serif font-bold text-studelle-burgundy tracking-tighter">Studelle</h2>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-studelle-burgundy/30 mt-3">Mengenkripsi Ruang Akademik Anda</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return <Login />;
  }

  return (
    <Router>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/kurikulum" element={<Curriculum />} />
          <Route path="/evaluasi" element={<SessionEvaluation />} />
          <Route path="/khs" element={<GradeCard />} />
          <Route path="/transkrip" element={<Transcript />} />
          <Route path="/unduhan" element={<Downloads />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </AuthProvider>
  );
}
