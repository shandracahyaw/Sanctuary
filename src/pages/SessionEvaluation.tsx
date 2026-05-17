import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { 
  Plus, 
  Trash2, 
  Edit3,
  GraduationCap, 
  BarChart3,
  Star,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { getCourses, addEvaluation, getEvaluations, updateEvaluation, deleteEvaluation } from '@/src/services/firestoreService';
import { cn } from '@/src/lib/utils';

const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

const SessionEvaluation = () => {
  const { userId, profile } = useAuth();
  const [activeSem, setActiveSem] = useState(1);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [semesterEvals, setSemesterEvals] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [editingCell, setEditingCell] = useState<{ id: string | null, session: number, type: string } | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const [formData, setFormData] = useState({
    session: 1,
    type: 'Kehadiran',
    score: 0
  });

  useEffect(() => {
    if (userId) {
      setLoading(true);
      getCourses(userId).then(data => {
        setCourses(data || []);
        setLoading(false);
      });
    }
  }, [userId]);

  const activeCourses = courses.filter(c => c.semester === activeSem);
  const selectedCourse = activeCourses.find(c => c.id === selectedCourseId) || (activeCourses.length > 0 ? activeCourses[0] : null);

  useEffect(() => {
    if (userId && selectedCourse) {
      const unsubscribe = getEvaluations(userId, selectedCourse.id, (data) => {
        setEvaluations(data);
      });
      return () => unsubscribe();
    } else {
      setEvaluations([]);
    }
  }, [userId, selectedCourse]);

  // Listen to all courses in semester for semester average
  useEffect(() => {
    if (userId && activeCourses.length > 0) {
      const unsubs = activeCourses.map(course => 
        getEvaluations(userId, course.id, (data) => {
          setSemesterEvals(prev => ({ ...prev, [course.id]: data }));
        })
      );
      return () => unsubs.forEach(u => u());
    } else {
      setSemesterEvals({});
    }
  }, [userId, activeSem, activeCourses.length]);

  const courseCategory = selectedCourse?.category || 'Non BPro';
  const isBPro = courseCategory.includes('BPro');

  const isTutonAvailable = (session: number, sem: number = activeSem, isB: boolean = isBPro) => {
    if (isB) return false;
    if (sem >= 1 && sem <= 3) return true;
    if (sem >= 4 && sem <= 8) return [1, 2, 4, 6, 8].includes(session);
    return false;
  };

  const isTMKAvailable = (session: number) => {
    return [3, 5, 7].includes(session);
  };

  const isKehadiranAvailable = (session: number, sem: number = activeSem, isB: boolean = isBPro) => {
    return isTutonAvailable(session, sem, isB);
  };

  const getScoreFromList = (list: any[], session: number, type: string) => {
    const item = list.find(e => e.session === session && (e.type === type || (type === 'Tuton' && e.type === 'Tugas / Tuton') || (type === 'Kehadiran' && e.type === 'Kehadiran')));
    return item ? item.score : 0;
  };

  const calculateSessionAccumulationForEvaluations = (session: number, evalsList: any[], sem: number, isB: boolean) => {
    const keh = getScoreFromList(evalsList, session, 'Kehadiran');
    const tut = getScoreFromList(evalsList, session, 'Tuton');
    const tmk = getScoreFromList(evalsList, session, 'TMK');

    if (isB) {
      if (!isTMKAvailable(session)) return 0;
      return tmk / 3; // 100% split over 3 TMK sessions
    } else {
      const numKeh = (sem >= 1 && sem <= 3) ? 8 : 5;
      const numTut = (sem >= 1 && sem <= 3) ? 8 : 5;
      const numTMK = 3;

      const availableKeh = isKehadiranAvailable(session, sem, isB);
      const availableTut = isTutonAvailable(session, sem, isB);
      const availableTMK = isTMKAvailable(session);
      
      let contribution = 0;
      if (availableKeh) contribution += (keh * 0.2) / numKeh;
      if (availableTut) contribution += (tut * 0.3) / numTut;
      if (availableTMK) contribution += (tmk * 0.5) / numTMK;
      
      return contribution;
    }
  };

  const calculateCourseAverage = (courseId: string, evalsList: any[], sem: number, category: string) => {
    const isB = category.includes('BPro');
    const sessionsList = [1, 2, 3, 4, 5, 6, 7, 8];
    const accumulations = sessionsList.map(s => calculateSessionAccumulationForEvaluations(s, evalsList, sem, isB));
    
    // Total is sum of session accumulations
    const total = accumulations.reduce((sum, val) => sum + val, 0);
    return total;
  };

  const selectedCourseAvg = calculateCourseAverage(selectedCourse?.id || '', evaluations, activeSem, courseCategory);
  
  const semesterAverage = activeCourses.length > 0 
    ? activeCourses.reduce((sum, c) => sum + calculateCourseAverage(c.id, semesterEvals[c.id] || [], activeSem, c.category || ''), 0) / activeCourses.length
    : 0;

  const sessions = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleSubmit = async () => {
    if (!userId || !selectedCourse) return;
    
    setSubmitting(true);
    try {
      const existing = evaluations.find(e => e.session === formData.session && e.type === formData.type);
      if (existing) {
        await updateEvaluation(userId, selectedCourse.id, existing.id, { score: formData.score });
      } else {
        await addEvaluation(userId, selectedCourse.id, formData);
      }
      setFormData({ ...formData, score: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCell = async () => {
    if (!userId || !selectedCourse || !editingCell) return;
    setSubmitting(true);
    try {
      if (editingCell.id) {
        await updateEvaluation(userId, selectedCourse.id, editingCell.id, { score: editValue });
      } else {
        await addEvaluation(userId, selectedCourse.id, {
          session: editingCell.session,
          type: editingCell.type,
          score: editValue
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEditingCell(null);
      setSubmitting(false);
    }
  };

  const getScore = (session: number, type: string) => {
    const evalItem = evaluations.find(e => e.session === session && (e.type === type || (type === 'Tuton' && e.type === 'Tugas / Tuton')));
    return evalItem ? { id: evalItem.id, score: evalItem.score } : { id: null, score: null };
  };

  const calculateSessionAccumulation = (session: number) => {
    return calculateSessionAccumulationForEvaluations(session, evaluations, activeSem, isBPro);
  };

  const grandTotal = sessions.reduce((sum, s) => sum + calculateSessionAccumulation(s), 0);

  return (
    <div className="space-y-12 pb-20 pt-6">
      <PageHeader title="Evaluasi Sesi Akademik" />

      {/* Main Tabs Navigation */}
      <div className="bg-studelle-burgundy p-2 rounded-[2rem] border border-white/5 overflow-x-auto no-scrollbar shadow-2xl">
        <div className="flex gap-2 min-w-max p-1">
          {semesters.map((sem) => (
            <button
              key={sem}
              onClick={() => {
                setActiveSem(sem);
                setSelectedCourseId(null);
              }}
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

      {/* Course List Horizontal */}
      <div className="flex flex-wrap justify-center gap-4">
        {activeCourses.length > 0 ? activeCourses.map((course) => (
          <button
            key={course.id}
            onClick={() => setSelectedCourseId(course.id)}
            className={cn(
              "px-8 py-4 rounded-[1.5rem] border text-xs font-bold tracking-widest transition-all duration-300",
              (selectedCourseId === course.id || (!selectedCourseId && selectedCourse?.id === course.id))
                ? "bg-studelle-accent text-white border-studelle-accent shadow-xl scale-105"
                : "bg-white text-studelle-burgundy/40 border-studelle-burgundy/10 hover:border-studelle-burgundy/30 hover:shadow-lg"
            )}
          >
            {course.name}
          </button>
        )) : (
          <p className="text-sm font-medium tracking-widest text-white/20 py-4 italic">Belum ada matakuliah terdaftar di semester ini</p>
        )}
      </div>

      {selectedCourse ? (
        <div className="grid grid-cols-1 gap-10">
           {/* Analysis Header */}
           <div className="studelle-card p-10 bg-studelle-burgundy text-white relative overflow-hidden group border-none">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                 <div className="space-y-3">
                    <p className="text-xs font-bold tracking-[0.3em] text-white/30 uppercase">{courseCategory.replace(' (Umum)', '').replace(' (Pilihan)', '')}</p>
                    <h3 className="text-4xl font-serif font-bold tracking-tight leading-none italic">{selectedCourse.name}</h3>
                 </div>
                 
                 <div className="flex items-center gap-10">
                    <div className="text-right">
                       <p className="text-xs font-bold tracking-[0.2em] text-white/30 mb-2 uppercase">Rata-rata Matkul</p>
                       <p className="text-6xl font-serif font-bold text-studelle-gold tracking-tighter">{selectedCourseAvg.toFixed(1)}</p>
                    </div>
                    <div className="h-16 w-px bg-white/10 hidden md:block" />
                    <div className="text-right">
                       <p className="text-xs font-bold tracking-[0.2em] text-white/30 mb-2 uppercase">Semester Perf.</p>
                       <p className="text-4xl font-serif font-bold text-white">{semesterAverage.toFixed(1)}</p>
                    </div>
                 </div>
              </div>
              <BarChart3 size={180} className="absolute -bottom-12 -right-12 opacity-5" />
           </div>

           {/* Input Form */}
           <div className="studelle-card p-10 space-y-8 shadow-xl">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-studelle-accent text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Plus size={24} />
                 </div>
                 <h3 className="text-2xl font-serif font-bold text-studelle-burgundy">Log Data Penilaian</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <FieldGroup label="Sesi">
                   <select 
                     value={formData.session}
                     onChange={(e) => setFormData({...formData, session: parseInt(e.target.value)})}
                     className="studelle-input appearance-none bg-studelle-cream border-studelle-burgundy/5"
                   >
                     {sessions.map(i => <option key={i} value={i}>Sesi {i}</option>)}
                   </select>
                </FieldGroup>
                
                <FieldGroup label="Jenis">
                   <select 
                     value={formData.type}
                     onChange={(e) => setFormData({...formData, type: e.target.value})}
                     className="studelle-input appearance-none bg-studelle-cream border-studelle-burgundy/5"
                   >
                     <option value="Kehadiran">Kehadiran</option>
                     <option value="Tuton">Tuton</option>
                     <option value="TMK">TMK</option>
                   </select>
                </FieldGroup>

                <FieldGroup label="Nilai (0-100)">
                   <input 
                     type="number" 
                     value={formData.score || ''}
                     onChange={(e) => {
                       const val = e.target.value;
                       const parsed = parseInt(val, 10);
                       setFormData({...formData, score: isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed))});
                     }}
                     className="studelle-input bg-studelle-cream border-studelle-burgundy/5"
                   />
                </FieldGroup>

                <button 
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="studelle-button h-14 flex items-center justify-center gap-3"
                >
                   {submitting ? <Loader2 size={24} className="animate-spin" /> : <Star size={20} />}
                   <span>Simpan</span>
                </button>
              </div>
           </div>

           {/* Performance Board Table */}
           <div className="studelle-card overflow-hidden shadow-2xl border border-studelle-burgundy/10">
              <div className="p-10 border-b border-studelle-burgundy/5 bg-studelle-cream-light/30">
                 <h3 className="text-3xl font-serif font-bold text-studelle-burgundy leading-none tracking-tight">Performance Board</h3>
                 <p className="text-sm font-medium tracking-wide text-studelle-burgundy/40 mt-3">Detail Evaluasi Sesi Akademik</p>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-studelle-burgundy/[0.02] text-studelle-burgundy/50 text-xs font-bold tracking-widest uppercase">
                          <th className="px-10 py-6">{isBPro ? 'PERTEMUAN' : 'SESI'}</th>
                          {!isBPro && <th className="px-10 py-6 text-center">KEHADIRAN (20%)</th>}
                          {!isBPro && <th className="px-10 py-6 text-center">TUTON (30%)</th>}
                          <th className="px-10 py-6 text-center">TMK {isBPro ? '(100%)' : '(50%)'}</th>
                          <th className="px-10 py-6 text-center bg-studelle-gold/5">AKUMULASI SESI</th>
                          <th className="px-10 py-6 text-right">AKSI</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-studelle-burgundy/5">
                       {sessions.map((num) => {
                          const sessAccum = calculateSessionAccumulation(num);
                          const keh = getScore(num, 'Kehadiran');
                          const tut = getScore(num, 'Tuton');
                          const tmk = getScore(num, 'TMK');

                          const availableKeh = isKehadiranAvailable(num);
                          const availableTut = isTutonAvailable(num);
                          const availableTMK = isTMKAvailable(num);

                          return (
                            <tr key={num} className="group hover:bg-studelle-burgundy/[0.01] transition-colors">
                               <td className="px-10 py-8 font-serif font-bold text-studelle-burgundy italic">S{num}</td>
                               
                               {!isBPro && (
                                 <ScoreCell 
                                   session={num}
                                   type="Kehadiran"
                                   scoreObj={keh}
                                   available={availableKeh}
                                   onEdit={() => { setEditingCell({ id: keh.id, session: num, type: 'Kehadiran' }); setEditValue(keh.score || 0); }}
                                   isEditing={editingCell?.session === num && editingCell?.type === 'Kehadiran'}
                                   editValue={editValue}
                                   onEditValueChange={setEditValue}
                                   onSave={handleEditCell}
                                   onCancel={() => setEditingCell(null)}
                                 />
                               )}
                               
                               {!isBPro && (
                                 <ScoreCell 
                                   session={num}
                                   type="Tuton"
                                   scoreObj={tut}
                                   available={availableTut}
                                   onEdit={() => { setEditingCell({ id: tut.id, session: num, type: 'Tuton' }); setEditValue(tut.score || 0); }}
                                   isEditing={editingCell?.session === num && editingCell?.type === 'Tuton'}
                                   editValue={editValue}
                                   onEditValueChange={setEditValue}
                                   onSave={handleEditCell}
                                   onCancel={() => setEditingCell(null)}
                                 />
                               )}

                               <ScoreCell 
                                 session={num}
                                 type="TMK"
                                 scoreObj={tmk}
                                 available={availableTMK}
                                 onEdit={() => { setEditingCell({ id: tmk.id, session: num, type: 'TMK' }); setEditValue(tmk.score || 0); }}
                                 isEditing={editingCell?.session === num && editingCell?.type === 'TMK'}
                                 editValue={editValue}
                                 onEditValueChange={setEditValue}
                                 onSave={handleEditCell}
                                 onCancel={() => setEditingCell(null)}
                               />

                               <td className="px-10 py-8 text-center bg-studelle-gold/5">
                                  <span className={cn(
                                    "text-lg font-serif font-bold",
                                    sessAccum > 0 ? "text-studelle-accent" : "text-studelle-burgundy/20"
                                  )}>
                                    {sessAccum.toFixed(1)}
                                  </span>
                               </td>

                               <td className="px-10 py-8 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                       onClick={() => {
                                         const ids = [keh.id, tut.id, tmk.id].filter(id => id);
                                         if (ids.length === 0) return;
                                         if (window.confirm(`Hapus semua data untuk sesi ${num}?`)) {
                                           ids.forEach(id => deleteEvaluation(userId!, selectedCourse.id, id!));
                                         }
                                       }}
                                       className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                     >
                                        <Trash2 size={12} />
                                     </button>
                                  </div>
                               </td>
                             </tr>
                          );
                       })}
                       
                       <tr className="bg-studelle-burgundy text-white font-serif">
                          <td className="px-10 py-8 text-lg font-bold" colSpan={isBPro ? 2 : 4}>GRAND TOTAL NILAI</td>
                          <td className="px-10 py-8 text-center text-4xl font-bold text-studelle-gold">
                            {grandTotal.toFixed(1)}
                          </td>
                          <td className="px-10 py-8 text-right">
                             <Star size={24} className="opacity-30 ml-auto" />
                          </td>
                       </tr>
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      ) : activeCourses.length > 0 ? (
        <div className="py-20 text-center">
           <Loader2 className="animate-spin mx-auto text-studelle-burgundy/20" size={48} />
        </div>
      ) : (
        <div className="py-40 studelle-card text-center space-y-8 shadow-2xl">
           <div className="w-24 h-24 bg-studelle-burgundy/5 rounded-[3rem] mx-auto flex items-center justify-center text-studelle-burgundy/10">
              <GraduationCap size={64} />
           </div>
           <p className="text-xl font-serif font-medium text-studelle-burgundy/30 max-w-md mx-auto">Tentukan matakuliah Anda di menu Kurikulum untuk memulai pemantauan sesi akademik.</p>
        </div>
      )}

      <footer className="pt-12 border-t border-white/5 text-center">
        <p className="text-[11px] font-medium tracking-[0.1em] text-white/20 uppercase">
          Studelle Royale Sanctuary — Precision Academic Monitoring © 2026
        </p>
      </footer>
    </div>
  );
};

const ScoreCell = ({ available, scoreObj, onEdit, isEditing, editValue, onEditValueChange, onSave, onCancel }: any) => {
  if (!available) {
    return <td className="px-10 py-8 text-center"><span className="text-[10px] font-black tracking-widest text-studelle-burgundy/10">N/A</span></td>;
  }
  if (isEditing) {
    return (
      <td className="px-10 py-8 text-center">
         <div className="flex items-center justify-center gap-2">
            <input type="number" value={editValue} onChange={(e) => onEditValueChange(parseInt(e.target.value) || 0)} className="w-16 h-8 studelle-input text-center p-0 text-xs" autoFocus />
            <button onClick={onSave} className="text-green-500 hover:scale-110"><Check size={16} /></button>
            <button onClick={onCancel} className="text-red-500 hover:scale-110"><X size={16} /></button>
         </div>
      </td>
    );
  }
  return (
    <td className="px-10 py-8 text-center cursor-pointer group/cell" onClick={onEdit}>
       <div className="flex items-center justify-center gap-2">
          <span className={cn("text-base font-bold", scoreObj.score !== null ? "text-studelle-burgundy" : "text-studelle-burgundy/10")}>{scoreObj.score !== null ? scoreObj.score : '0'}</span>
          <Edit3 size={10} className="text-studelle-accent opacity-0 group-hover/cell:opacity-100 transition-opacity" />
       </div>
    </td>
  );
};

const FieldGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
     <label className="text-[9px] font-black tracking-widest text-studelle-burgundy/40 uppercase ml-2 italic">{label}</label>
     {children}
  </div>
);

export default SessionEvaluation;
