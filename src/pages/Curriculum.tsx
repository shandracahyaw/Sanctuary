import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { Plus, Trash2, Edit3, BookMarked, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { subscribeCourses, addCourse, updateCourse, deleteCourse } from '@/src/services/firestoreService';
import { cn } from '@/src/lib/utils';

const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

const Curriculum = () => {
  const { user, userId, profile } = useAuth();
  const [activeSem, setActiveSem] = useState(1);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    category: 'Non BPro',
    type: 'Wajib',
    code: '',
    name: '',
    sks: 0,
    lecturer: ''
  });

  useEffect(() => {
    if (userId) {
      setLoading(true);
      const unsubscribe = subscribeCourses(userId, (data) => {
        setAllCourses(data || []);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [userId]);

  const activeCourses = allCourses
    .filter(c => c.semester === activeSem)
    .sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  const totalSks = activeCourses.reduce((acc, c) => acc + (c.sks || 0), 0);

  const handleSubmit = async () => {
    if (!userId || !formData.code || !formData.name) return;
    setSubmitting(true);
    
    const courseData = {
      ...formData,
      semester: activeSem
    };

    try {
      if (editingId) {
        await updateCourse(userId, editingId, courseData);
      } else {
        await addCourse(userId, courseData);
      }
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'Non BPro',
      type: 'Wajib',
      code: '',
      name: '',
      sks: 0,
      lecturer: ''
    });
    setEditingId(null);
  };

  const handleEdit = (course: any) => {
    setEditingId(course.id);
    setFormData({
      category: course.category,
      type: course.type || 'Wajib',
      code: course.code,
      name: course.name,
      sks: course.sks,
      lecturer: course.lecturer || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;
    if (window.confirm('Hapus matakuliah ini dari kurikulum?')) {
      await deleteCourse(userId, id);
    }
  };

  return (
    <div className="space-y-12 pb-20 pt-6">
      <PageHeader title="Informasi Kurikulum" />

      {/* Tabs Container */}
      <div className="bg-studelle-burgundy p-2 rounded-[2rem] border border-white/5 overflow-x-auto no-scrollbar shadow-2xl">
        <div className="flex gap-2 min-w-max p-1">
          {semesters.map((sem) => (
            <button
              key={sem}
              onClick={() => setActiveSem(sem)}
              className={cn(
                "px-10 py-4 rounded-2xl text-xs font-bold tracking-widest transition-all duration-300",
                activeSem === sem 
                  ? "bg-studelle-accent text-white shadow-xl scale-105" 
                  : "text-white/30 hover:text-white/60 hover:bg-white/5"
              )}
            >
              Semester {sem}
            </button>
          ))}
        </div>
      </div>

      {/* Input Card */}
      <div className="studelle-card p-12 space-y-10">
         <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-studelle-burgundy text-white rounded-[1.25rem] flex items-center justify-center shadow-2xl">
               <Plus size={28} />
            </div>
            <div>
               <h3 className="text-3xl font-serif font-bold text-studelle-burgundy leading-none">{editingId ? 'Edit Matakuliah' : 'Tambah Matakuliah'}</h3>
               <p className="text-sm font-medium tracking-wide text-studelle-burgundy/40 mt-1.5">{editingId ? 'Perbarui Rincian Struktur Akademik' : 'Input Rincian Struktur Akademik Baru'}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Kategori</label>
               <select 
                 value={formData.category}
                 onChange={(e) => setFormData({...formData, category: e.target.value})}
                 className="studelle-input appearance-none cursor-pointer bg-studelle-cream border-studelle-burgundy/5"
               >
                 <option value="Non BPro">Non BPro</option>
                 <option value="BPro">BPro</option>
                 {activeSem === 7 && <option value="TAP (Tugas Akhir Program)">TAP (Tugas Akhir Program)</option>}
               </select>
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Kode Matakuliah</label>
               <input 
                 type="text" 
                 value={formData.code}
                 onChange={(e) => setFormData({...formData, code: e.target.value})}
                 placeholder="Contoh: MK001" 
                 className="studelle-input bg-studelle-cream border-studelle-burgundy/5"
               />
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Nama Matakuliah</label>
               <input 
                 type="text" 
                 value={formData.name}
                 onChange={(e) => setFormData({...formData, name: e.target.value})}
                 placeholder="Contoh: Matematika Murni" 
                 className="studelle-input bg-studelle-cream border-studelle-burgundy/5"
               />
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Bobot SKS</label>
               <input 
                 type="number" 
                 value={formData.sks || ''}
                 onChange={(e) => {
                   const val = e.target.value;
                   const parsed = parseInt(val, 10);
                   setFormData({...formData, sks: isNaN(parsed) ? 0 : parsed});
                 }}
                 className="studelle-input bg-studelle-cream border-studelle-burgundy/5"
               />
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Jenis Matakuliah</label>
               <select 
                 value={formData.type}
                 onChange={(e) => setFormData({...formData, type: e.target.value})}
                 className="studelle-input appearance-none cursor-pointer bg-studelle-cream border-studelle-burgundy/20"
               >
                 <option value="Wajib">Wajib</option>
                 <option value="Pilihan">Pilihan</option>
               </select>
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Dosen Pengampu</label>
               <input 
                 type="text" 
                 value={formData.lecturer}
                 onChange={(e) => setFormData({...formData, lecturer: e.target.value})}
                 placeholder="Nama lengkap dosen" 
                 className="studelle-input bg-studelle-cream border-studelle-burgundy/5"
               />
            </div>
            <div className="md:pt-8 flex items-end">
               <button 
                 onClick={handleSubmit}
                 disabled={submitting}
                 className="studelle-button w-full h-14"
               >
                  {submitting ? <Loader2 size={24} className="animate-spin" /> : (editingId ? "Perbarui Matakuliah" : "Simpan Matakuliah")}
               </button>
            </div>
         </div>
         {editingId && (
            <button 
              onClick={resetForm}
              className="text-xs font-bold text-studelle-burgundy/40 hover:text-studelle-burgundy uppercase tracking-widest"
            >
              Batal Edit
            </button>
         )}
      </div>

      {/* List Card */}
      <div className="studelle-card shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
         <div className="p-10 bg-studelle-burgundy/[0.02] border-b border-studelle-burgundy/5 flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-studelle-burgundy/5 rounded-[1.25rem] flex items-center justify-center text-studelle-burgundy shadow-inner">
                  <BookMarked size={28} />
               </div>
               <div>
                  <h3 className="text-3xl font-serif font-bold text-studelle-burgundy leading-none">Semester {activeSem}</h3>
                  <p className="text-sm font-medium tracking-wide text-studelle-burgundy/40 mt-1.5">Daftar Struktur Akademik Resmi</p>
               </div>
            </div>
            <div className="bg-studelle-burgundy text-white px-8 py-3 rounded-2xl text-xs font-bold tracking-widest shadow-xl">
               {activeCourses.length} Matakuliah Terdaftar
            </div>
         </div>

         <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-studelle-burgundy/10">
            <table className="w-full min-w-[800px] md:min-w-0 text-left">
               <thead>
                  <tr className="border-b border-studelle-burgundy/5 text-studelle-burgundy/40 text-xs font-bold tracking-widest bg-studelle-burgundy/[0.01]">
                     <th className="px-12 py-8">KODE</th>
                     <th className="px-12 py-8">NAMA MATKUL</th>
                     <th className="px-12 py-8 text-center">SKS</th>
                     <th className="px-12 py-8 text-center uppercase">Jenis</th>
                     <th className="px-12 py-8">DOSEN</th>
                     <th className="px-12 py-8 text-right">AKSI</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-studelle-burgundy/5">
                  {loading ? (
                    <tr>
                       <td colSpan={6} className="px-12 py-40 text-center">
                          <Loader2 size={48} className="animate-spin text-studelle-burgundy/20 mx-auto" />
                       </td>
                    </tr>
                  ) : activeCourses.length > 0 ? (
                    activeCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-studelle-burgundy/[0.03] transition-colors group">
                         <td className="px-12 py-10">
                            <p className="text-sm font-mono font-bold text-studelle-accent tracking-tighter">{course.code}</p>
                            <p className="text-[10px] font-medium text-studelle-burgundy/40 mt-1">{course.category}</p>
                         </td>
                         <td className="px-12 py-10">
                            <p className="text-lg font-serif font-bold text-studelle-burgundy tracking-tight italic">{course.name}</p>
                          </td>
                          <td className="px-12 py-10 text-center">
                             <div className="inline-flex flex-col items-center">
                                <p className="text-3xl font-serif font-bold text-studelle-burgundy leading-none">{course.sks}</p>
                                <span className="text-[10px] font-bold text-studelle-burgundy/30 mt-1">SKS</span>
                             </div>
                          </td>
                         <td className="px-12 py-10 text-center">
                            <span className={cn(
                               "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                               course.type === 'Wajib' ? "bg-studelle-burgundy/5 text-studelle-burgundy/60" : "bg-studelle-gold/10 text-studelle-gold"
                            )}>
                               {course.type || 'Wajib'}
                            </span>
                         </td>
                         <td className="px-12 py-10">
                            <p className="text-sm font-serif font-medium text-studelle-burgundy/60">{course.lecturer || '-'}</p>
                         </td>
                         <td className="px-12 py-10 text-right">
                            <div className="flex justify-end gap-3 transition-all duration-300">
                               <button 
                                 onClick={() => handleEdit(course)}
                                 title="Edit Matakuliah"
                                 className="w-12 h-12 rounded-2xl bg-studelle-burgundy/5 flex items-center justify-center text-studelle-burgundy/40 hover:text-studelle-gold hover:bg-white transition-all shadow-sm border border-transparent hover:border-studelle-gold/20"
                               >
                                  <Edit3 size={18} />
                               </button>
                               <button 
                                 onClick={() => {
                                   handleDelete(course.id);
                                 }}
                                 title="Hapus Matakuliah"
                                 className="w-12 h-12 rounded-2xl bg-studelle-burgundy/5 flex items-center justify-center text-studelle-burgundy/40 hover:text-red-500 hover:bg-white transition-all shadow-sm border border-transparent hover:border-red-100"
                               >
                                  <Trash2 size={18} />
                               </button>
                            </div>
                         </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                       <td colSpan={6} className="px-12 py-40 text-center space-y-8">
                          <div className="w-24 h-24 bg-studelle-burgundy/5 rounded-[3rem] mx-auto flex items-center justify-center text-studelle-burgundy/20 shadow-inner">
                             <GraduationCap size={48} />
                          </div>
                          <p className="text-xl font-serif font-medium text-studelle-burgundy/40">Belum ada matakuliah yang terdaftar di semester ini.</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>

         {activeCourses.length > 0 && (
           <div className="p-10 bg-studelle-burgundy/[0.03] border-t border-studelle-burgundy/5 flex justify-center">
              <div className="flex items-center gap-5 bg-white/80 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-studelle-burgundy/10 shadow-2xl">
                 <p className="text-xs font-bold tracking-widest text-studelle-burgundy/40">Akumulasi Bobot</p>
                 <div className="w-px h-6 bg-studelle-burgundy/10" />
                 <p className="text-4xl font-serif font-bold text-studelle-burgundy">{totalSks}<span className="text-sm ml-2 opacity-40">SKS</span></p>
              </div>
           </div>
         )}
      </div>

      <footer className="pt-12 border-t border-white/5 text-center">
        <p className="text-[11px] font-medium tracking-[0.1em] text-white/20 uppercase">
          Studelle Royale Sanctuary — Transparansi Kurikulum Terintegrasi © 2026
        </p>
      </footer>
    </div>

  );
};

export default Curriculum;
