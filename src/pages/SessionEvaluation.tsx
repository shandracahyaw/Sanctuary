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
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { getCourses, addEvaluation, getEvaluations, updateEvaluation, deleteEvaluation } from '@/src/services/firestoreService';
import { cn } from '@/src/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const isBPro = courseCategory === 'BPro';

  const isTutonAvailable = (session: number, sem: number = activeSem, currentIsBPro: boolean = isBPro) => {
    if (currentIsBPro) return false;
    if (sem >= 1 && sem <= 3) return [1, 2, 3, 4, 5, 6, 7, 8].includes(session);
    if (sem >= 4 && sem <= 8) return [1, 2, 4, 6, 8].includes(session);
    return false;
  };

  const isTMKAvailable = (session: number) => {
    return [3, 5, 7].includes(session);
  };

  const isKehadiranAvailable = (session: number, sem: number = activeSem, currentIsBPro: boolean = isBPro) => {
    return isTutonAvailable(session, sem, currentIsBPro);
  };

  const getScoreFromList = (list: any[], session: number, type: string) => {
    const item = list.find(e => e.session === session && e.type === type);
    return item ? item.score : 0;
  };

  const calculateGrandTotal = (evalsList: any[], sem: number, category: string) => {
    const currentIsBPro = category === 'BPro';
    
    if (currentIsBPro) {
      const tmkSessions = [3, 5, 7];
      const tmkSum = tmkSessions.reduce((sum, s) => sum + getScoreFromList(evalsList, s, 'TMK'), 0);
      return tmkSum / 3;
    } else {
      const kehSessions = (sem >= 1 && sem <= 3) ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 4, 6, 8];
      const tutSessions = (sem >= 1 && sem <= 3) ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 4, 6, 8];
      const tmkSessions = [3, 5, 7];

      const kehSum = kehSessions.reduce((sum, s) => sum + getScoreFromList(evalsList, s, 'Kehadiran'), 0);
      const tutSum = tutSessions.reduce((sum, s) => sum + getScoreFromList(evalsList, s, 'Tuton'), 0);
      const tmkSum = tmkSessions.reduce((sum, s) => sum + getScoreFromList(evalsList, s, 'TMK'), 0);

      const kehAvg = kehSessions.length > 0 ? kehSum / kehSessions.length : 0;
      const tutAvg = tutSessions.length > 0 ? tutSum / tutSessions.length : 0;
      const tmkAvg = tmkSessions.length > 0 ? tmkSum / tmkSessions.length : 0;

      return (kehAvg * 0.2) + (tutAvg * 0.3) + (tmkAvg * 0.5);
    }
  };

  const selectedCourseAvg = calculateGrandTotal(evaluations, activeSem, courseCategory);
  
  const semesterAverage = activeCourses.length > 0 
    ? activeCourses.reduce((sum, c) => sum + calculateGrandTotal(semesterEvals[c.id] || [], activeSem, c.category || ''), 0) / activeCourses.length
    : 0;

  const sessions = [1, 2, 3, 4, 5, 6, 7, 8];

  const calculateSessionAccumulation = (session: number) => {
    if (isBPro) {
      if (!isTMKAvailable(session)) return 0;
      const tmk = getScoreFromList(evaluations, session, 'TMK');
      return tmk / 3;
    } else {
      const keh = getScoreFromList(evaluations, session, 'Kehadiran');
      const tut = getScoreFromList(evaluations, session, 'Tuton');
      const tmk = getScoreFromList(evaluations, session, 'TMK');

      const isKeh = isKehadiranAvailable(session);
      const isTut = isTutonAvailable(session);
      const isTmk = isTMKAvailable(session);

      const numKeh = (activeSem >= 1 && activeSem <= 3) ? 8 : 5;
      const numTut = (activeSem >= 1 && activeSem <= 3) ? 8 : 5;
      const numTmk = 3;

      let contrib = 0;
      if (isKeh) contrib += (keh * 0.2) / numKeh;
      if (isTut) contrib += (tut * 0.3) / numTut;
      if (isTmk) contrib += (tmk * 0.5) / numTmk;

      return contrib;
    }
  };

  const grandTotal = calculateGrandTotal(evaluations, activeSem, courseCategory);

  const handleDownloadPDF = () => {
    if (!selectedCourse || !userId) return;
    
    const doc = new jsPDF();
    const PRIMARY_COLOR = [6, 95, 70]; // #065f46 Emerald Green
    const TEXT_DARK = [20, 20, 20];

    // Page Frame
    // (Frame removed)

    // Header Background
    doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.rect(0, 0, 210, 40, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(36);
    doc.text("STUDELLE ACADEMIC", 105, 20, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("LAPORAN CAPAIAN NILAI PER MATA KULIAH", 105, 27, { align: "center" });

    // Identity Section title
    const idTitle = "IDENTITAS MAHASISWA";
    const titleY = 58; 

    // Identity Content
    const identityLabels = [
      { label: "NAMA LENGKAP", value: (profile?.displayName || '-').toUpperCase() },
      { label: "NIM / ID SISWA", value: (profile?.nim || '-') },
      { label: "FAKULTAS", value: (profile?.faculty || 'Fakultas Belum Set') },
      { label: "PROGRAM STUDI", value: (profile?.programStudy || 'Prodi Belum Set') },
      { label: "SEMESTER AKTIF", value: String(activeSem) },
    ];

    const contentStartY = titleY + 11; 
    const rowHeight = 7; 
    const contentEndY = contentStartY + ((identityLabels.length - 1) * rowHeight);

    // Draw Box
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(0.5);
    doc.rect(7, titleY - 8, 196, (contentEndY - titleY) + 14, 'S');

    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(idTitle, 11, titleY);
    const idTitleWidth = doc.getTextWidth(idTitle);
    doc.line(11, titleY + 2, 11 + idTitleWidth, titleY + 2);

    doc.setFontSize(10);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);

    identityLabels.forEach((item, i) => {
      doc.setFont("times", "bold");
      doc.text(item.label, 11, contentStartY + (i * rowHeight));
      doc.text(":", 46, contentStartY + (i * rowHeight));
      doc.setFont("times", "normal");
      doc.text(item.value, 49, contentStartY + (i * rowHeight));
    });

    // Course Section title
    const sectionTitleY = contentEndY + 18;
    
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(`MATAKULIAH: ${selectedCourse.name} (${selectedCourse.code})`, 11, sectionTitleY);
    doc.line(11, sectionTitleY + 2, 11 + doc.getTextWidth(`MATAKULIAH: ${selectedCourse.name} (${selectedCourse.code})`), sectionTitleY + 2);

    // Table
    autoTable(doc, {
      startY: sectionTitleY + 11,
      head: [['PERTEMUAN', 'KEHADIRAN', 'TUTON', 'TMK', 'NILAI SESI']],
      body: sessions.map(num => [
        `Pertemuan ${num}`,
        !isBPro ? (getScoreFromList(evaluations, num, 'Kehadiran') || 0).toFixed(1) : '-',
        !isBPro ? (getScoreFromList(evaluations, num, 'Tuton') || 0).toFixed(1) : '-',
        (getScoreFromList(evaluations, num, 'TMK') || 0).toFixed(1),
        calculateSessionAccumulation(num).toFixed(1)
      ]),
      headStyles: { 
        fillColor: PRIMARY_COLOR as any, 
        textColor: 255, 
        halign: 'center', 
        fontStyle: 'bold', 
        font: 'times', 
        fontSize: 10,
        cellPadding: 4
      },
      bodyStyles: { 
        textColor: TEXT_DARK as any, 
        font: 'times', 
        fontSize: 10, 
        halign: 'center',
        cellPadding: 4,
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      styles: { valign: 'middle' },
      columnStyles: {
        0: { halign: 'left', cellWidth: 40 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 30 },
      },
      margin: { left: 20, right: 20 }
    });

    // Accumulation Box
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(0.7);
    doc.rect(13, finalY, 184, 18);
    
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.text(`AKUMULASI NILAI AKHIR MATAKULIAH: ${grandTotal.toFixed(1)}`, 105, finalY + 11, { align: "center" });

    // Dynamic Box for Table & Accumulation
    const boxBottomY = finalY + 18 + 5;
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(0.5);
    doc.rect(7, sectionTitleY - 8, 196, boxBottomY - (sectionTitleY - 8), 'S');

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("times", "normal");
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Dokumen ini dicetak secara otomatis melalui Studelle System pada: ${dateStr} pukul ${timeStr}`, 105, 285, { align: "center" });

    doc.save(`Laporan_Evaluasi_${selectedCourse.code}_${profile?.displayName?.replace(/\s+/g, '_')}.pdf`);
  };

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
    const evalItem = evaluations.find(e => e.session === session && e.type === type);
    return evalItem ? { id: evalItem.id, score: evalItem.score } : { id: null, score: null };
  };

  return (
    <div className="space-y-12 pb-20 pt-6">
      <PageHeader title="Evaluasi Sesi Akademik" />

      {/* Main Tabs Navigation */}
      <div className="bg-studelle-emerald p-2 rounded-[2rem] border border-white/5 overflow-x-auto no-scrollbar shadow-2xl">
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
              : "bg-white text-studelle-emerald/40 border-studelle-emerald/10 hover:border-studelle-emerald/30 hover:shadow-lg"
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
         <div className="studelle-card p-10 bg-studelle-emerald text-white relative overflow-hidden group border-none">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-white">
                 <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-white/40 uppercase">
                          <span className="font-mono">{selectedCourse.code}</span>
                          <span className="opacity-20">|</span>
                          <span className="font-serif italic">{selectedCourse.sks} SKS</span>
                          <span className="opacity-20">|</span>
                          <span className="font-serif italic">{selectedCourse.type}</span>
                          <span className="opacity-20">|</span>
                          <span className="font-serif italic">{selectedCourse.category}</span>
                        </div>
                        <h3 className="text-4xl font-serif font-bold tracking-tight leading-none italic">{selectedCourse.name}</h3>
                    </div>
                    <button 
                      onClick={handleDownloadPDF}
                      className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold tracking-widest px-6 py-3 rounded-xl border border-white/10 transition-all uppercase flex items-center gap-2"
                    >
                      <FileText size={16} />
                      Unduh Laporan PDF
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-10">
                    <div className="text-right">
                       <p className="text-xs font-bold tracking-[0.2em] text-white/30 mb-2 uppercase">Nilai Akhir Est.</p>
                       <p className="text-6xl font-serif font-bold text-studelle-gold tracking-tighter">{selectedCourseAvg.toFixed(1)}</p>
                    </div>
                    <div className="h-16 w-px bg-white/10 hidden md:block" />
                    <div className="text-right">
                       <p className="text-xs font-bold tracking-[0.2em] text-white/30 mb-2 uppercase">Sem. Avg</p>
                       <p className="text-4xl font-serif font-bold text-white tracking-tighter">{semesterAverage.toFixed(1)}</p>
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
                 <h3 className="text-2xl font-serif font-bold text-studelle-emerald">Log Data Penilaian</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <FieldGroup label="Sesi">
                   <select 
                     value={formData.session}
                     onChange={(e) => setFormData({...formData, session: parseInt(e.target.value)})}
                     className="studelle-input appearance-none bg-studelle-cream border-studelle-emerald/5"
                   >
                     {sessions.map(i => <option key={i} value={i}>{isBPro ? 'Pertemuan' : 'Sesi'} {i}</option>)}
                   </select>
                </FieldGroup>
                
                <FieldGroup label="Jenis">
                   <select 
                     value={formData.type}
                     onChange={(e) => setFormData({...formData, type: e.target.value})}
                     className="studelle-input appearance-none bg-studelle-cream border-studelle-emerald/5"
                   >
                     {!isBPro && <option value="Kehadiran">Kehadiran</option>}
                     {!isBPro && <option value="Tuton">Tuton</option>}
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
                     className="studelle-input bg-studelle-cream border-studelle-emerald/5 font-mono"
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
           <div className="studelle-card overflow-hidden shadow-2xl border border-studelle-emerald/10">
              <div className="p-10 border-b border-studelle-emerald/5 bg-studelle-cream-light/30">
                 <h3 className="text-3xl font-serif font-bold text-studelle-emerald leading-none tracking-tight">Performance Board</h3>
                 <p className="text-sm font-medium tracking-wide text-studelle-emerald/40 mt-3">Detail Evaluasi Sesi Akademik</p>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-studelle-emerald/[0.02] text-studelle-emerald/50 text-xs font-bold tracking-widest uppercase">
                          <th className="px-10 py-6">{isBPro ? 'PERTEMUAN' : 'SESI'}</th>
                          {!isBPro && <th className="px-10 py-6 text-center border-l border-studelle-emerald/5">KEHADIRAN (20%)</th>}
                          {!isBPro && <th className="px-10 py-6 text-center border-l border-studelle-emerald/5">TUTON (30%)</th>}
                          <th className="px-10 py-6 text-center border-l border-studelle-emerald/5">
                            TMK {isBPro ? '(100%)' : '(50%)'}
                          </th>
                          <th className="px-10 py-6 text-center border-l border-studelle-emerald/5 bg-studelle-gold/5">AKUMULASI</th>
                          <th className="px-10 py-6 text-right border-l border-studelle-emerald/5">AKSI</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-studelle-emerald/5">
                       {sessions.map((num) => {
                          const sessAccum = calculateSessionAccumulation(num);
                          const keh = getScore(num, 'Kehadiran');
                          const tut = getScore(num, 'Tuton');
                          const tmk = getScore(num, 'TMK');

                          const availableKeh = isKehadiranAvailable(num);
                          const availableTut = isTutonAvailable(num);
                          const availableTMK = isTMKAvailable(num);

                          return (
                            <tr key={num} className="group hover:bg-studelle-emerald/[0.01] transition-colors">
                               <td className="px-10 py-8 font-serif font-bold text-studelle-emerald italic">S{num}</td>
                               
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

                               <td className="px-10 py-8 text-center bg-studelle-gold/5 border-l border-studelle-emerald/5">
                                  <span className={cn(
                                    "text-lg font-mono font-bold",
                                    sessAccum > 0 ? "text-studelle-accent" : "text-studelle-emerald/20"
                                  )}>
                                    {sessAccum > 0 ? sessAccum.toFixed(1) : '-'}
                                  </span>
                               </td>

                               <td className="px-10 py-8 text-right border-l border-studelle-emerald/5">
                                  <div className="flex justify-end gap-2 transition-opacity">
                                     <button 
                                       onClick={() => {
                                         const ids = [keh.id, tut.id, tmk.id].filter(id => id);
                                         if (ids.length === 0) return;
                                         if (window.confirm(`Hapus semua data untuk sesi ${num}?`)) {
                                           ids.forEach(async (id) => {
                                             if (id) await deleteEvaluation(userId!, selectedCourse.id, id);
                                           });
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
                       
                       <tr className="bg-studelle-emerald text-white font-serif">
                          <td className="px-10 py-8 text-lg font-bold" colSpan={isBPro ? 2 : 4}>GRAND TOTAL NILAI AKHIR</td>
                          <td className="px-10 py-8 text-center text-4xl font-bold text-studelle-gold bg-black/10 border-l border-white/10 tracking-tighter">
                            {grandTotal.toFixed(1)}
                          </td>
                          <td className="px-10 py-8 text-right border-l border-white/10">
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
           <Loader2 className="animate-spin mx-auto text-studelle-emerald/20" size={48} />
        </div>
      ) : (
        <div className="py-40 studelle-card text-center space-y-8 shadow-2xl">
           <div className="w-24 h-24 bg-studelle-emerald/5 rounded-[3rem] mx-auto flex items-center justify-center text-studelle-emerald/10">
              <GraduationCap size={64} />
           </div>
           <p className="text-xl font-serif font-medium text-studelle-emerald/30 max-w-md mx-auto">Tentukan matakuliah Anda di menu Kurikulum untuk memulai pemantauan sesi akademik.</p>
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
    return <td className="px-10 py-8 text-center border-l border-studelle-emerald/5"><span className="text-[10px] font-black tracking-widest text-studelle-emerald/10">N/A</span></td>;
  }
  if (isEditing) {
    return (
      <td className="px-10 py-8 text-center border-l border-studelle-emerald/5">
         <div className="flex items-center justify-center gap-2">
            <input type="number" value={editValue} onChange={(e) => onEditValueChange(parseInt(e.target.value) || 0)} className="w-16 h-8 studelle-input text-center p-0 text-xs font-mono" autoFocus />
            <button onClick={onSave} className="text-green-500 hover:scale-110"><Check size={16} /></button>
            <button onClick={onCancel} className="text-red-500 hover:scale-110"><X size={16} /></button>
         </div>
      </td>
    );
  }
  return (
    <td className="px-10 py-8 text-center cursor-pointer group/cell border-l border-studelle-emerald/5" onClick={onEdit}>
       <div className="flex items-center justify-center gap-2">
          <span className={cn("text-base font-mono font-bold", scoreObj.score !== null ? "text-studelle-emerald" : "text-studelle-emerald/10")}>{scoreObj.score !== null ? scoreObj.score : '0'}</span>
          <Edit3 size={10} className="text-studelle-accent opacity-0 group-hover/cell:opacity-100 transition-opacity" />
       </div>
    </td>
  );
};

const FieldGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
     <label className="text-[9px] font-black tracking-widest text-studelle-emerald/40 uppercase ml-2 italic">{label}</label>
     {children}
  </div>
);

export default SessionEvaluation;
