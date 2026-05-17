import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Star, CircleCheck, Heart } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { getCourses, getGrades } from '@/src/services/firestoreService';

const Dashboard = () => {
  const { user, userId, profile } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      getCourses(userId).then(data => setCourses(data || []));
      getGrades(userId).then(data => setGrades(data || []));
    }
  }, [userId]);

  const totalSks = courses.reduce((acc, course) => acc + (course.sks || 0), 0);
  const totalMutu = grades.reduce((acc, grade) => acc + (grade.totalPoint || 0), 0);
  const gpa = totalSks > 0 ? (totalMutu / totalSks).toFixed(2) : "0.00";
  const completionRate = Math.min(Math.round((totalSks / 144) * 100), 100);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const today = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-12 pb-20 pt-6">
      <PageHeader title="Beranda" />

      {/* Greeting */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-studelle-gold rounded-full animate-pulse" />
          <span className="text-[11px] font-semibold tracking-widest text-studelle-gold">Akses Terotomasi</span>
        </div>
        <h1 className="text-5xl text-white font-serif font-bold">
          {getGreeting()}, <span className="font-serif italic text-studelle-gold underline decoration-white/20">{profile?.displayName?.split(' ')[0]}</span>
        </h1>
        <p className="text-xs font-medium tracking-wide text-white/40">{profile?.username}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Card */}
          <div className="studelle-card p-10 flex flex-col md:flex-row items-center gap-12">
            <div className="relative">
              <div className="w-36 h-36 rounded-3xl bg-studelle-emerald-dark p-1 overflow-hidden shadow-2xl rotate-3">
                <img 
                  src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || 'User')}&background=064e3b&color=fff`} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-studelle-emerald text-white p-2.5 rounded-xl shadow-lg">
                <Heart size={18} fill="white" />
              </div>
            </div>
            
            <div className="flex-1 space-y-5 text-center md:text-left">
              <div className="space-y-2">
                <h2 className="text-4xl font-serif font-bold text-studelle-emerald leading-none">{profile?.displayName}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                  <div className="w-12 h-1 bg-studelle-emerald-dark/10 rounded-full" />
                  <p className="text-sm font-bold tracking-wide text-studelle-emerald opacity-40">NIM #{profile?.nim}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Badge label="Fakultas" value={profile?.faculty || '-'} />
                <Badge label="Program Studi" value={profile?.programStudy || '-'} />
                <Badge label="Semester" value={`Semester ${profile?.semester || 1}`} />
              </div>
            </div>
          </div>

          {/* Progress Chart Placeholder */}
          <div className="studelle-card p-10 min-h-[350px] flex flex-col">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-studelle-emerald/5 p-3 rounded-2xl text-studelle-emerald">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-studelle-emerald">Jalur Perkembangan Akademik</h3>
                <p className="text-xs font-medium tracking-wide text-studelle-emerald/40">Komparasi Grafik IPS (Batang) & IPK (Garis)</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-50">
              <div className="w-20 h-20 border-2 border-dashed border-studelle-emerald/10 rounded-3xl flex items-center justify-center text-studelle-emerald/20">
                <Star size={40} />
              </div>
              <div className="text-center">
                 <p className="text-lg font-serif font-medium text-studelle-emerald">Catatan akademik belum tersedia...</p>
                 <p className="text-xs font-medium tracking-wide text-studelle-emerald/40 mt-2">Input data untuk memvisualisasikan progres anda</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Cumulative IPK Card */}
          <div className="studelle-card p-10 flex flex-col items-center justify-between text-center min-h-[480px]">
             <div className="space-y-2">
                <p className="text-xs font-bold tracking-[0.2em] text-studelle-emerald/30">Capaian Kumulatif</p>
                <div className="w-16 h-1.5 bg-studelle-gold/20 mx-auto rounded-full" />
             </div>

             <div className="py-8">
                <p className="text-sm font-bold tracking-widest text-studelle-emerald/40 mb-2">Indeks Prestasi</p>
                <h4 className="text-[130px] font-serif font-bold text-studelle-emerald tracking-tighter leading-none">{gpa}</h4>
                <div className="w-24 h-1.5 bg-studelle-accent/20 mx-auto rounded-full mt-4" />
             </div>

             <div className="w-full grid grid-cols-2 gap-4 bg-studelle-emerald/[0.03] rounded-3xl p-8 border border-studelle-emerald/5">
                <div className="space-y-1">
                   <p className="text-[10px] font-bold tracking-widest text-studelle-emerald/30">Total SKS</p>
                   <p className="text-3xl font-serif font-bold text-studelle-emerald">{totalSks}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-bold tracking-widest text-studelle-emerald/30">Penyelesaian</p>
                   <p className="text-3xl font-serif font-bold text-studelle-emerald">{completionRate}%</p>
                </div>
             </div>
          </div>

          {/* Status Card */}
          <div className="studelle-card bg-studelle-emerald text-white p-10 relative group overflow-hidden border-none">
             <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:rotate-12 transition-transform duration-700">
                <Star size={56} />
             </div>
             
             <div className="space-y-8 relative z-10">
                <div>
                   <h3 className="text-2xl font-serif font-bold leading-none">Status Pelajar</h3>
                   <p className="text-[10px] font-bold tracking-widest text-white/30 mt-3">Status Resmi Mahasiswa</p>
                </div>

                <div className="flex items-center gap-4">
                   <div className="w-4 h-4 bg-white rounded-full animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                   <h4 className="text-5xl font-serif font-bold tracking-tight text-white">Aktif</h4>
                </div>
             </div>

             <div className="absolute bottom-6 right-6 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-xl">
                <CircleCheck size={24} />
             </div>
          </div>
          
          <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
             <p className="text-sm font-serif font-medium text-white/60 leading-relaxed italic">
               "Setiap SKS yang diraih adalah langkah menuju kesuksesan akademik Anda."
             </p>
          </div>
        </div>
      </div>

      <footer className="pt-12 border-t border-white/5 text-center">
        <p className="text-[11px] font-medium tracking-[0.1em] text-white/20">
          Studelle Royale Sanctuary © 2026 — Dibuat dengan penuh dedikasi untuk {profile?.displayName}
        </p>
      </footer>
    </div>

  );
};

const Badge = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-studelle-emerald/5 px-4 py-2 rounded-xl border border-studelle-emerald/5 text-center">
    <p className="text-[9px] font-bold tracking-widest text-studelle-emerald opacity-30 uppercase">{label}</p>
    <p className="text-[10px] font-bold text-studelle-emerald mt-1">{value}</p>
  </div>
);

export default Dashboard;
