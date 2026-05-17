import React, { useEffect, useState } from 'react';
import { Award, GraduationCap, FileText, Star, Loader2, Search, Filter, Edit3, Trash2, X, Check } from 'lucide-react';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { subscribeGrades, deleteGrade, updateGrade, subscribeCourses } from '@/src/services/firestoreService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');

  useEffect(() => {
    if (userId) {
      setLoading(true);
      const unsubCourses = subscribeCourses(userId, (coursesData) => {
        setCourses(coursesData || []);
      });
      const unsubGrades = subscribeGrades(userId, (data) => {
        setGrades((data || []));
        setLoading(false);
      });
      return () => {
        unsubCourses();
        unsubGrades();
      };
    }
  }, [userId]);

  const getFullGrades = () => {
    return grades.map(g => {
      if (g.semester) return g;
      const course = courses.find(c => c.id === g.courseId || c.code === g.courseCode);
      return { ...g, semester: course?.semester };
    }).sort((a: any, b: any) => 
      ((a.semester || 0) - (b.semester || 0)) || 
      (a.courseCode || a.courseName || '').localeCompare(b.courseCode || b.courseName || '')
    );
  };

  const allFullGrades = getFullGrades();

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
        totalPoint: (editFormData.sks || 0) * point
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

  const filteredGrades = allFullGrades.filter(g => {
    const matchSearch = (g.courseName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (g.courseCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSem = selectedSemester === 'all' || g.semester === selectedSemester;
    return matchSearch && matchSem;
  });

  const totalPoints = filteredGrades.reduce((sum, g) => sum + g.totalPoint, 0);
  const totalSKS = filteredGrades.reduce((sum, g) => sum + g.sks, 0);
  const ipk = totalSKS > 0 ? (totalPoints / totalSKS).toFixed(2) : "0.00";
  const semestersCount = new Set(grades.map(g => g.semester)).size || profile?.semester || 1;

  const getPredikat = (ipk: number) => {
    if (ipk >= 3.51) return "DENGAN PUJIAN (CUMLAUDE)";
    if (ipk >= 3.01) return "SANGAT MEMUASKAN";
    if (ipk >= 2.76) return "MEMUASKAN";
    if (ipk >= 2.00) return "CUKUP";
    return "KURANG";
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const PRIMARY_COLOR = [92, 10, 40]; // #5C0A28 Burgundy
    const TEXT_DARK = [20, 20, 20];

    // Page Frame
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(0.1);
    doc.rect(5, 5, 200, 287, 'S');

    // Header Background
    doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.rect(0, 0, 210, 45, 'F'); // Increased height

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(36);
    doc.text("STUDELLE ACADEMIC", 105, 22, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("TRANSKRIP NILAI AKADEMIK KUMULATIF", 105, 36, { align: "center" });

    // Identity Section title
    const idTitle = "IDENTITAS MAHASISWA";
    const titleY = 58; 

    // Identity Content
    const identityLabels = [
      { label: "NAMA LENGKAP", value: (profile?.displayName || '-').toUpperCase() },
      { label: "NIM / ID SISWA", value: (profile?.nim || '-') },
      { label: "FAKULTAS", value: (profile?.faculty || 'Fakultas Belum Set') },
      { label: "PROGRAM STUDI", value: (profile?.programStudy || 'Prodi Belum Set') },
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

    // Table Header Info
    const tableTitleY = contentEndY + 18; // Increased gap
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("INFORMASI NILAI TRANSKRIP", 10, tableTitleY);
    doc.setLineWidth(0.5);
    doc.line(10, tableTitleY + 2, 200, tableTitleY + 2); // Table width: 210 - 20 = 190. Ends at 200.

    const fullGradesForPDF = getFullGrades();
    
    // Table
    autoTable(doc, {
      startY: tableTitleY + 10, // Gap ~9mm (1.5 lines)
      head: [['SMT', 'KODE MK', 'NAMA MATAKULIAH', 'SKS', 'NILAI', 'BOBOT', 'MUTU', 'KET']],
      body: fullGradesForPDF.map((g) => [
        `Smt ${g.semester || '-'}`,
        (g.courseCode || g.code || '-').toUpperCase(),
        (g.courseName || g.name || '-'),
        String(g.sks || 0),
        g.letterGrade || '-',
        (g.point || 0).toFixed(2),
        (g.totalPoint || 0).toFixed(2),
        (g.letterGrade === 'E' || g.point === 0) ? 'TL' : 'LL'
      ]),
      headStyles: { 
        fillColor: PRIMARY_COLOR as any, 
        textColor: 255, 
        halign: 'center', 
        fontStyle: 'bold', 
        font: 'times', 
        fontSize: 7,
        cellPadding: 3 // Slightly more padding for header
      },
      bodyStyles: { 
        textColor: TEXT_DARK as any, 
        font: 'times', 
        fontSize: 7,
        cellPadding: 2, // Tight body padding
        lineWidth: 0.1,
        lineColor: [100, 100, 100] // Darker borders
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      styles: { 
        valign: 'middle',
        lineColor: [100, 100, 100],
        minCellHeight: 0.2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // SMT
        1: { halign: 'center', cellWidth: 18 }, // KODE MK
        2: { halign: 'left', cellWidth: 70 },   // MATAKULIAH
        3: { halign: 'center', cellWidth: 15 }, // SKS
        4: { halign: 'center', cellWidth: 18 }, // NILAI
        5: { halign: 'center', cellWidth: 18 }, // BOBOT
        6: { halign: 'center', cellWidth: 18 }, // MUTU
        7: { halign: 'center', cellWidth: 15 }, // KET
      },
      margin: { left: 10, right: 10 }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 105;
    const tPoints = fullGradesForPDF.reduce((sum, g) => sum + (g.totalPoint || 0), 0);
    const tSks = fullGradesForPDF.reduce((sum, g) => sum + (g.sks || 0), 0);
    const tIpk = tSks > 0 ? tPoints / tSks : 0;

    // Check if summary fits on page
    if (finalY > 230) doc.addPage();
    const summaryY = finalY > 230 ? 20 : finalY + 10;

    // Summary Box
    const boxX = 13;
    const boxW = 184;
    const boxH = 35;
    const dividerX = 110;

    // Background for Right Section
    doc.setFillColor(248, 248, 245); // Light beige background
    doc.rect(dividerX, summaryY, boxW - (dividerX - boxX), boxH, 'F');

    // Box Border
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(0.8);
    doc.rect(boxX, summaryY, boxW, boxH, 'S');

    // Divider Line
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(dividerX, summaryY + 5, dividerX, summaryY + 30); 

    doc.setFontSize(9);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont("times", "bold");
    
    // Left summary
    const labelX = 18;
    const colonX = 64;
    
    doc.text("TOTAL SKS KUMULATIF", labelX, summaryY + 10);
    doc.text(`: ${tSks}`, colonX, summaryY + 10);
    doc.text("TOTAL MUTU KUMULATIF", labelX, summaryY + 18);
    doc.text(`: ${tPoints.toFixed(2)}`, colonX, summaryY + 18);
    doc.text("PREDIKAT KELULUSAN", labelX, summaryY + 26);
    
    // Predicate adjustment for long text
    const predikat = getPredikat(tIpk);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    if (predikat.length > 20) doc.setFontSize(8);
    doc.text(`: ${predikat}`, colonX, summaryY + 26);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFontSize(9);

    // Right summary (IPK)
    const centerXRight = dividerX + (boxW - (dividerX - boxX)) / 2;
    doc.setFontSize(10);
    doc.text("IP Kumulatif (IPK)", centerXRight, summaryY + 14, { align: "center" });
    doc.setFontSize(24);
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.text(tIpk.toFixed(2), centerXRight, summaryY + 28, { align: "center" });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("times", "normal");
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Dokumen ini dicetak secara otomatis melalui Studelle System pada: ${dateStr} pukul ${timeStr}`, 105, 285, { align: "center" });

    doc.save(`Transkrip_${(profile?.displayName || 'Mahasiswa').replace(/\s+/g, '_')}.pdf`);
  };

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
            <button onClick={handleDownloadPDF} className="studelle-button py-3 px-10 text-[10px]">Cetak Transkrip</button>
         </div>

         <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-studelle-burgundy/10">
            <table className="w-full min-w-[800px] md:min-w-0 text-left">
                <thead>
                    <tr className="border-b border-studelle-burgundy/5 text-studelle-burgundy/50 text-xs font-bold tracking-widest uppercase bg-studelle-burgundy/[0.01]">
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
                        <td colSpan={8} className="px-12 py-40 text-center">
                           <Loader2 size={48} className="animate-spin text-studelle-burgundy/20 mx-auto" />
                        </td>
                     </tr>
                   ) : filteredGrades.length > 0 ? (
                     filteredGrades.map((grade, index) => {
                       const isEditing = editingId === grade.id;

                       return (
                        <tr key={grade.id} className="hover:bg-studelle-burgundy/[0.01] transition-colors group">
                           <td className="px-12 py-10">
                              <p className="text-sm font-bold text-studelle-burgundy/60 tracking-wider uppercase">{grade.courseCode || '-'}</p>
                           </td>
                           <td className="px-12 py-10">
                              <p className="text-lg font-serif font-bold text-studelle-burgundy tracking-tight italic">{grade.courseName}</p>
                              {isEditing ? (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[10px] font-bold text-studelle-burgundy/30 uppercase">Sem:</span>
                                  <select 
                                    value={editFormData.semester || 1}
                                    onChange={(e) => setEditFormData({ ...editFormData, semester: parseInt(e.target.value) })}
                                    className="studelle-input h-8 py-0 px-2 text-[10px] w-20"
                                  >
                                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                              ) : (
                                <p className="text-[10px] font-bold text-studelle-burgundy/30 uppercase tracking-widest">Semester {grade.semester || '-'}</p>
                              )}
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
                                <p className="text-base font-serif font-bold text-studelle-burgundy/40 tracking-widest">{grade.sks}</p>
                              )}
                           </td>
                           <td className="px-12 py-10 text-center">
                              {isEditing ? (
                                <select 
                                  value={editFormData.letterGrade}
                                  onChange={(e) => setEditFormData({ ...editFormData, letterGrade: e.target.value })}
                                  className="w-16 studelle-input text-center h-10 p-0 appearance-none bg-white font-serif font-bold"
                                >
                                  {Object.keys(gradeMapping).map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                              ) : (
                                <span className="text-4xl font-serif font-bold text-studelle-accent tracking-tighter leading-none">{grade.letterGrade}</span>
                              )}
                           </td>
                           <td className="px-12 py-10 text-center text-base font-bold text-studelle-burgundy/60">
                              <p className="text-2xl font-serif font-bold text-studelle-burgundy/60 leading-none">{grade.point?.toFixed(2)}</p>
                           </td>
                           <td className="px-12 py-10 text-center">
                              <p className="text-2xl font-serif font-bold text-studelle-gold leading-none">{grade.totalPoint?.toFixed(2)}</p>
                           </td>
                           <td className="px-12 py-10 text-center">
                              <span className={cn(
                                "text-[10px] font-bold px-4 py-1.5 rounded-xl tracking-widest uppercase shadow-sm border",
                                (grade.letterGrade === 'E' || grade.point === 0) 
                                  ? "bg-red-50 text-red-500 border-red-100" 
                                  : "bg-studelle-burgundy text-white border-studelle-burgundy"
                              )}>
                                {(grade.letterGrade === 'E' || grade.point === 0) ? 'TL' : 'LL'}
                              </span>
                           </td>
                           <td className="px-12 py-10 text-right">
                             <div className="flex justify-end gap-3 transition-all">
                                {isEditing ? (
                                  <>
                                    <button 
                                      onClick={handleUpdate}
                                      disabled={submitting}
                                      className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all shadow-md"
                                    >
                                       {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={20} />}
                                    </button>
                                    <button 
                                      onClick={() => { setEditingId(null); setEditFormData(null); }}
                                      className="w-12 h-12 rounded-2xl bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-all shadow-md"
                                    >
                                       <X size={20} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => startEdit(grade)}
                                      title="Edit Record"
                                      className="w-12 h-12 rounded-2xl bg-studelle-burgundy/5 flex items-center justify-center text-studelle-burgundy/20 hover:text-studelle-gold hover:bg-white transition-all shadow-sm border border-transparent hover:border-studelle-gold/20"
                                    >
                                       <Edit3 size={20} />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(grade.id)}
                                      title="Hapus Record"
                                      className="w-12 h-12 rounded-2xl bg-studelle-burgundy/5 flex items-center justify-center text-studelle-burgundy/20 hover:text-red-500 hover:bg-white transition-all shadow-sm border border-transparent hover:border-red-100"
                                    >
                                       <Trash2 size={20} />
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
                       <td colSpan={8} className="px-12 py-40 text-center space-y-8">
                          <div className="w-24 h-24 bg-studelle-burgundy/5 rounded-[3rem] mx-auto flex items-center justify-center text-studelle-burgundy/10 shadow-inner">
                            <FileText size={48} />
                          </div>
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
