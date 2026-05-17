import React, { useEffect, useState } from 'react';
import { Award, GraduationCap, FileText, Star, Loader2, Search, Filter, Edit3, Trash2, X, Check } from 'lucide-react';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { subscribeGrades, deleteGrade, updateGrade } from '@/src/services/firestoreService';

const gradeMapping: { [key: string]: number } = {
  'A': 4.00,
  'A-': 3.50,
  'B': 3.00,
  'B-': 2.50,
  'C': 2.00,
  'C-': 1.50,
  'D': 1.00,
  'E': 0.00
};

const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

const Transcript = () => {
  const { profile, user, userId } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');

  useEffect(() => {
    if (userId) {
      setLoading(true);
      const unsubscribe = subscribeGrades(userId, (data) => {
        setGrades((data || []).sort((a: any, b: any) => 
          (a.semester - b.semester) || 
          (a.courseCode || a.courseName || '').localeCompare(b.courseCode || b.courseName || '')
        ));
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [userId]);

  const handleDelete = async (id: string) => {
    if (!userId || !window.confirm('Hapus rincian nilai ini?')) return;
    try {
      await deleteGrade(userId, id);
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (grade: any) => {
    setEditingId(grade.id);
    setEditFormData({ ...grade });
  };

  const handleUpdate = async () => {
    if (!userId || !editingId || !editFormData) return;
    setSubmitting(true);
    
    try {
      // Recalculate based on grade
      const point = gradeMapping[editFormData.letterGrade] || 0;
      const updatedData = {
        ...editFormData,
        point: point,
        totalPoint: editFormData.sks * point
      };

      await updateGrade(userId, editingId, updatedData);
      setEditingId(null);
      setEditFormData(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGrades = grades.filter(g => {
    const matchSearch = (g.courseName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (g.courseCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSem = selectedSemester === 'all' || g.semester === selectedSemester;
    return matchSearch && matchSem;
  });

  const totalPoints = filteredGrades.reduce((sum, g) => sum + g.totalPoint, 0);
  const totalSKS = filteredGrades.reduce((sum, g) => sum + g.sks, 0);
  const ipk = totalSKS > 0 ? (totalPoints / totalSKS).toFixed(2) : "0.00";
  const semestersCount = new Set(grades.map(g => g.semester)).size || profile?.semester || 1;

  return (
    <div className="space-y-12 pb-20 pt-6">
      <PageHeader title="Transkrip Akademik" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="studelle-card p-10 flex flex-col justify-between min-h-[180px] relative overflow-hidden bg-studelle-burgundy text-white group shadow-2xl border-none">
           <div className="relative z-10 space-y-2">
              <p className="text-[10px] font-bold tracking-[0.3em] opacity-50 uppercase">Indeks Prestasi Kumulatif</p>
              <h4 className="text-7xl font-serif font-bold tracking-tighter">{ipk}</h4>
           </div>
           <div className="absolute top-0 right-0 p-6 opacity-10 transform scale-150 group-hover:rotate-12 transition-transform duration-1000">
              <Award size={80} />
           </div>
        </div>

        <div className="studelle-card p-10 flex flex-col justify-between min-h-[180px] relative overflow-hidden border-studelle-burgundy/10 shadow-xl">
           <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-[0.3em] text-studelle-burgundy/50 uppercase">Total SKS Lulus</p>
              <h4 className="text-7xl font-serif font-bold text-studelle-burgundy tracking-tighter">{totalSKS}</h4>
           </div>
           <div className="absolute top-0 right-0 p-6 opacity-5">
              <Star size={80} />
           </div>
        </div>

        <div className="studelle-card p-10 flex flex-col justify-between min-h-[180px] relative overflow-hidden bg-white/5 border-white/10 shadow-xl">
           <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">Semester Ditempuh</p>
              <h4 className="text-7xl font-serif font-bold text-studelle-gold tracking-tighter">{semestersCount}</h4>
           </div>
           <div className="absolute top-0 right-0 p-6 opacity-10">
              <GraduationCap size={80} />
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 studelle-card p-5 flex items-center gap-5 shadow-xl">
           <Search size={22} className="text-studelle-burgundy/30 ml-2" />
           <input 
             type="text" 
             placeholder="Cari Matakuliah..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="bg-transparent border-none focus:ring-0 text-base font-medium text-studelle-burgundy placeholder:text-studelle-burgundy/30 w-full"
           />
        </div>
        <div className="md:w-72">
           <select 
             value={selectedSemester}
             onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
             className="studelle-input appearance-none bg-studelle-cream border-studelle-burgundy/10 shadow-xl"
           >
              <option value="all">Semua Semester</option>
              {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
           </select>
        </div>
      </div>

      <div className="studelle-card shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-studelle-burgundy/10">
         <div className="p-10 border-b border-studelle-burgundy/5 flex justify-between items-center">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-studelle-burgundy/5 rounded-[1.25rem] flex items-center justify-center text-studelle-burgundy shadow-inner">
                  <FileText size={28} />
               </div>
               <div>
                  <h3 className="text-3xl font-serif font-bold text-studelle-burgundy leading-none">Lembar Transkrip</h3>
                  <p className="text-sm font-medium tracking-wide text-studelle-burgundy/40 mt-1.5">Dokumen Resmi Terverifikasi Sistem</p>
               </div>
            </div>
            <button className="studelle-button py-3 px-10 text-[10px]">Cetak Transkrip</button>
         </div>

         <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-studelle-burgundy/10">
            <table className="w-full min-w-[800px] md:min-w-0 text-left">
               <thead>
                   <tr className="border-b border-studelle-burgundy/5 text-studelle-burgundy/50 text-xs font-bold tracking-widest uppercase bg-studelle-burgundy/[0.01]">
                      <th className="px-12 py-8 text-center">NO</th>
                      <th className="px-12 py-8 text-center">SMT</th>
                      <th className="px-12 py-8">KODE</th>
                      <th className="px-12 py-8">MATAKULIAH</th>
                      <th className="px-12 py-8 text-center">SKS</th>
                      <th className="px-12 py-8 text-center">NILAI</th>
                      <th className="px-12 py-8 text-center">BOBOT</th>
                      <th className="px-12 py-8 text-center">MUTU</th>
                      <th className="px-12 py-8 text-center">KET</th>
                      <th className="px-12 py-8 text-right">AKSI</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-studelle-burgundy/5">
                  {loading ? (
                    <tr>
                       <td colSpan={10} className="px-12 py-40 text-center">
                          <Loader2 size={48} className="animate-spin text-studelle-burgundy/20 mx-auto" />
                       </td>
                    </tr>
                  ) : filteredGrades.length > 0 ? (
                    filteredGrades.map((grade, index) => {
                      const isEditing = editingId === grade.id;

                      return (
                       <tr key={grade.id} className="hover:bg-studelle-burgundy/[0.01] transition-colors group">
                          <td className="px-12 py-10 text-center font-bold text-studelle-burgundy/40">{index + 1}</td>
                          <td className="px-12 py-10 text-center font-bold text-studelle-burgundy/60">Smt {grade.semester}</td>
                          <td className="px-12 py-10">
                             <p className="text-sm font-bold text-studelle-burgundy/60 tracking-wider uppercase">{grade.courseCode || '-'}</p>
                          </td>
                          <td className="px-12 py-10">
                             <p className="text-lg font-serif font-bold text-studelle-burgundy tracking-tight italic">{grade.courseName}</p>
                          </td>
                          <td className="px-12 py-10 text-center">
                             {isEditing ? (
                               <input 
                                 type="number"
                                 value={editFormData.sks}
                                 onChange={(e) => setEditFormData({ ...editFormData, sks: parseInt(e.target.value) || 0 })}
                                 className="w-16 studelle-input text-center h-10 p-0"
                               />
                             ) : (
                               <p className="text-base font-bold text-studelle-burgundy/50 tracking-widest">{grade.sks}</p>
                             )}
                          </td>
                          <td className="px-12 py-10 text-center">
                             {isEditing ? (
                               <select 
                                 value={editFormData.letterGrade}
                                 onChange={(e) => setEditFormData({ ...editFormData, letterGrade: e.target.value })}
                                 className="w-16 studelle-input text-center h-10 p-0 appearance-none bg-white"
                               >
                                 {Object.keys(gradeMapping).map(g => <option key={g} value={g}>{g}</option>)}
                               </select>
                             ) : (
                               <span className="text-4xl font-serif font-bold text-studelle-accent tracking-tighter leading-none">{grade.letterGrade}</span>
                             )}
                          </td>
                          <td className="px-12 py-10 text-center text-lg font-bold text-studelle-burgundy/40">
                            {isEditing ? (gradeMapping[editFormData.letterGrade] || 0)?.toFixed(2) : grade.point?.toFixed(2)}
                          </td>
                           <td className="px-12 py-10 text-center text-lg font-bold text-studelle-gold">
                             {isEditing ? (editFormData.sks * (gradeMapping[editFormData.letterGrade] || 0))?.toFixed(2) : grade.totalPoint?.toFixed(2)}
                           </td>
                          <td className="px-12 py-10 text-center">
                             {isEditing ? (
                               <select 
                                 value={editFormData.status}
                                 onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                 className="text-[10px] studelle-input h-10 p-0 appearance-none bg-white"
                                >
                                  <option>Lulus (LL)</option>
                                  <option>Tidak Lulus (TL)</option>
                               </select>
                             ) : (
                               <span className={cn(
                                 "text-[10px] font-bold px-4 py-1.5 rounded-xl tracking-widest uppercase shadow-sm border",
                                 grade.status?.includes('TL') 
                                   ? "bg-red-50 text-red-500 border-red-100" 
                                   : "bg-studelle-burgundy text-white border-studelle-burgundy"
                               )}>
                                 {grade.status?.includes('TL') ? 'TL' : 'LL'}
                               </span>
                             )}
                          </td>
                          <td className="px-12 py-10 text-right">
                             <div className="flex justify-end gap-3">
                                {isEditing ? (
                                  <>
                                    <button 
                                      onClick={handleUpdate}
                                      disabled={submitting}
                                      className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all shadow-md"
                                    >
                                       {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    </button>
                                    <button 
                                      onClick={() => { setEditingId(null); setEditFormData(null); }}
                                      className="w-10 h-10 rounded-xl bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-all shadow-md"
                                    >
                                       <X size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => startEdit(grade)}
                                      title="Edit Record"
                                      className="w-10 h-10 rounded-xl bg-studelle-burgundy/5 flex items-center justify-center text-studelle-burgundy/40 hover:text-studelle-gold hover:bg-white transition-all shadow-sm border border-transparent hover:border-studelle-gold/20"
                                    >
                                       <Edit3 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(grade.id)}
                                      title="Hapus Record"
                                      className="w-10 h-10 rounded-xl bg-studelle-burgundy/5 flex items-center justify-center text-studelle-burgundy/40 hover:text-red-500 hover:bg-white transition-all shadow-sm border border-transparent hover:border-red-100"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                             </div>
                          </td>
                       </tr>
                      );
                    })
                  ) : (
                    <tr>
                       <td colSpan={10} className="px-12 py-40 text-center space-y-8 grayscale opacity-50">
                          <FileText size={70} className="mx-auto text-studelle-burgundy/10" />
                          <p className="text-xl font-serif font-medium text-studelle-burgundy/40">Belum ada data transkrip yang tersinkronisasi.</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      <footer className="pt-12 border-t border-white/5 text-center">
        <p className="text-[11px] font-medium tracking-[0.1em] text-white/20">
          Studelle Royale Sanctuary © 2026 — Semua rincian transkrip divalidasi oleh otoritas akademik
        </p>
      </footer>
    </div>

  );
};

export default Transcript;
