import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { 
  FileSpreadsheet, 
  Plus, 
  Star, 
  Award, 
  GraduationCap,
  Trash2,
  Edit2,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { subscribeCourses, addGrade, subscribeGrades, deleteGrade, updateGrade } from '@/src/services/firestoreService';
import { cn } from '@/src/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

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

const GradeCard = () => {
  const { user, userId, profile } = useAuth();
  const [activeSem, setActiveSem] = useState(1);
  const [courses, setCourses] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    courseId: '',
    letterGrade: 'A',
    point: 4.0,
    status: 'Lulus (LL)'
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      const unsubCourses = subscribeCourses(userId, (coursesData) => {
        setCourses(coursesData || []);
        setLoading(false);
      });
      const unsubGrades = subscribeGrades(userId, (gradesData) => {
        setGrades(gradesData || []);
        setLoading(false);
      });
      return () => {
        unsubCourses();
        unsubGrades();
      };
    }
  }, [userId]);

  const activeCourses = courses.filter(c => c.semester === activeSem);
  const selectedCourse = courses.find(c => c.id === formData.courseId);
  const activeGrades = grades.filter(g => {
    // Priority 1: Use the semester stored directly with the grade
    if (g.semester === activeSem) return true;
    
    // Priority 2: Fallback to the current course's semester if it exists and g.semester is missing
    if (!g.semester) {
      const course = courses.find(c => c.id === g.courseId);
      return course?.semester === activeSem;
    }
    
    return false;
  }).sort((a, b) => (a.courseCode || a.courseName || '').localeCompare(b.courseCode || b.courseName || ''));

  const handleSubmit = async () => {
    if (!userId || !formData.courseId) return;
    setSubmitting(true);
    try {
      const course = courses.find(c => c.id === formData.courseId);
      if (course) {
        const point = gradeMapping[formData.letterGrade] || 0;
        const gradeData = {
          ...formData,
          courseCode: course.code,
          courseName: course.name,
          sks: course.sks,
          semester: course.semester,
          type: course.type || 'Wajib',
          category: course.category || 'Non BPro',
          point: point,
          totalPoint: course.sks * point
        };
        
        if (editingId) {
          await updateGrade(userId, editingId, gradeData);
        } else {
          await addGrade(userId, gradeData);
        }
        
        resetForm();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      letterGrade: 'A',
      point: 4.0,
      status: 'Lulus (LL)'
    });
    setEditingId(null);
  };

  const handleEdit = (grade: any) => {
    setEditingId(grade.id);
    setFormData({
      courseId: grade.courseId,
      letterGrade: grade.letterGrade,
      point: grade.point || gradeMapping[grade.letterGrade] || 0,
      status: grade.status
    });
  };

  const handleDelete = async (gradeId: string) => {
    if (!userId) return;
    try {
      await deleteGrade(userId, gradeId);
    } catch (e) {
      console.error(e);
    }
  };

  const calculateIPS = (sem: number) => {
    const semGrades = grades.filter(g => {
      if (g.semester === sem) return true;
      if (!g.semester) {
        const course = courses.find(c => c.id === g.courseId);
        return course?.semester === sem;
      }
      return false;
    });
    if (semGrades.length === 0) return 0;
    const totalPoints = semGrades.reduce((sum, g) => sum + g.totalPoint, 0);
    const totalSKS = semGrades.reduce((sum, g) => sum + g.sks, 0);
    return totalSKS > 0 ? totalPoints / totalSKS : 0;
  };

  const totalPoints = grades.reduce((sum, g) => sum + g.totalPoint, 0);
  const totalSKS = grades.reduce((sum, g) => sum + g.sks, 0);
  const ipk = totalSKS > 0 ? totalPoints / totalSKS : 0;
  const ips = calculateIPS(activeSem);
  const totalSKSActive = activeGrades.reduce((sum, g) => sum + g.sks, 0);
  const totalMutuActive = activeGrades.reduce((sum, g) => sum + g.totalPoint, 0);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const PRIMARY_COLOR = [92, 10, 40]; // #5C0A28 Burgundy
    const TEXT_DARK = [20, 20, 20];

    // Page Frame
    doc.setPage(1);
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(0.1);
    doc.rect(5, 5, 200, 287, 'S'); // Much thinner outer margin

    // Header Background
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
    doc.text("KARTU HASIL STUDI (KHS) SEMESTER", 105, 36, { align: "center" });

    // Identity Section title
    const idTitle = "IDENTITAS MAHASISWA";
    const titleY = 58; 
    
    // Identity Content
    const labels = [
      { label: "NAMA LENGKAP", value: (profile?.displayName || '-').toUpperCase() },
      { label: "NIM / ID SISWA", value: (profile?.nim || '-') },
      { label: "FAKULTAS", value: (profile?.faculty || 'Fakultas Belum Set') },
      { label: "PROGRAM STUDI", value: (profile?.programStudy || 'Prodi Belum Set') },
      { label: "SEMESTER AKTIF", value: String(activeSem) },
    ];

    const contentStartY = titleY + 11; 
    const rowHeight = 7; 
    const contentEndY = contentStartY + ((labels.length - 1) * rowHeight);

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

    labels.forEach((item, i) => {
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
    doc.text(`INFORMASI NILAI KHS SEMESTER ${activeSem}`, 9, tableTitleY);
    doc.setLineWidth(0.5);
    doc.line(9, tableTitleY + 2, 201, tableTitleY + 2); 
    
    // Prepare data: merge activeCourses with grades to show all courses in sem
    const semGradesForPDF = activeCourses.map(course => {
      const grade = activeGrades.find(g => g.courseId === course.id);
      return {
        code: course.code,
        name: course.name,
        sks: course.sks,
        letterGrade: grade?.letterGrade || '-',
        point: grade?.point || 0,
        totalPoint: grade?.totalPoint || 0,
        status: grade?.status || '-'
      };
    }).sort((a, b) => (a.code || '').localeCompare(b.code || ''));

    // Table
    autoTable(doc, {
      startY: tableTitleY + 10, // Gap ~9mm (1.5 lines)
      head: [['KODE MK', 'MATAKULIAH', 'SKS', 'NILAI', 'BOBOT', 'MUTU', 'KET']],
      body: semGradesForPDF.map(g => [
        (g.code || '-').toUpperCase(),
        (g.name || '-'),
        String(g.sks || 0),
        g.letterGrade || '-',
        (g.point || 0).toFixed(2),
        (g.totalPoint || 0).toFixed(2),
        (g.letterGrade === 'E' || g.letterGrade === '-' || g.point === 0) ? 'TL' : 'LL'
      ]),
      headStyles: { 
        fillColor: PRIMARY_COLOR as any, 
        textColor: 255, 
        halign: 'center', 
        fontStyle: 'bold', 
        font: 'times', 
        fontSize: 8,
        cellPadding: 4 // Slightly more padding for header
      },
      bodyStyles: { 
        textColor: TEXT_DARK as any, 
        font: 'times', 
        fontSize: 8,
        cellPadding: 2.5, // Tighter body padding
        lineColor: [100, 100, 100], // Darker borders for better definition
        lineWidth: 0.1
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      styles: { 
        valign: 'middle', 
        overflow: 'linebreak',
        lineColor: [100, 100, 100],
        minCellHeight: 0.2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 22 }, // KODE MK
        1: { halign: 'left', cellWidth: 85 },   // MATAKULIAH
        2: { halign: 'center', cellWidth: 15 }, // SKS
        3: { halign: 'center', cellWidth: 18 }, // NILAI
        4: { halign: 'center', cellWidth: 18 }, // BOBOT
        5: { halign: 'center', cellWidth: 18 }, // MUTU
        6: { halign: 'center', cellWidth: 15 }, // KET
      },
      margin: { left: 9, right: 9 }
    });

    const finalY = ((doc as any).lastAutoTable?.finalY || 105) + 15;

    // Summary Box
    const boxX = 13;
    const boxW = 184;
    const boxH = 35;
    const dividerX = 110;

    // Background for Right Section
    doc.setFillColor(248, 248, 245); // Light beige background
    doc.rect(dividerX, finalY, boxW - (dividerX - boxX), boxH, 'F');

    // Box Border
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(0.8);
    doc.rect(boxX, finalY, boxW, boxH, 'S');

    // Divider Line
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(dividerX, finalY + 5, dividerX, finalY + 30); 

    doc.setFontSize(9);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    doc.setFont("times", "bold");
    
    // Left stats
    const labelX = 18;
    const colonX = 64;
    
    doc.text("TOTAL SKS SEMESTER", labelX, finalY + 10);
    doc.text(`: ${totalSKSActive}`, colonX, finalY + 10);
    
    doc.text("TOTAL MUTU SEMESTER", labelX, finalY + 18);
    doc.text(`: ${totalMutuActive.toFixed(2)}`, colonX, finalY + 18);
    
    doc.text("TOTAL SKS KUMULATIF", labelX, finalY + 26);
    doc.text(`: ${totalSKS}`, colonX, finalY + 26);

    // Right stats (IP)
    doc.setFontSize(10);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    
    doc.text(`IPS Semester ${activeSem}`, dividerX + 8, finalY + 14);
    doc.text(`: ${ips.toFixed(2)}`, dividerX + 45, finalY + 14);

    doc.text("IP Kumulatif", dividerX + 8, finalY + 26);
    doc.text(`: ${ipk.toFixed(2)}`, dividerX + 45, finalY + 26);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("times", "normal");
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Dokumen ini dicetak secara otomatis melalui Studelle System pada: ${dateStr} pukul ${timeStr}`, 105, 285, { align: "center" });

    doc.save(`KHS_Smt_${activeSem}_${(profile?.displayName || 'Mahasiswa').replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-12 pb-20 pt-6">
      <PageHeader title="Kartu Hasil Studi" />

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="studelle-card p-10 flex flex-col justify-between min-h-[180px] relative overflow-hidden bg-studelle-burgundy text-white group border-none shadow-2xl">
           <div className="relative z-10 space-y-2">
              <p className="text-[10px] font-bold tracking-[0.3em] opacity-50">Indeks Prestasi Semester</p>
              <h4 className="text-7xl font-serif font-bold tracking-tighter">{ips.toFixed(2)}</h4>
           </div>
           <div className="absolute top-0 right-0 p-6 opacity-10 transform scale-150 group-hover:rotate-12 transition-transform duration-1000">
              <TrendingUp size={80} />
           </div>
           <div className="relative z-10 w-fit bg-white/10 px-5 py-2 rounded-xl text-[10px] font-bold tracking-widest backdrop-blur-md">
              Status: {ips >= 3.5 ? 'Excellent Performance' : 'Good Progress'}
           </div>
        </div>

        <div className="studelle-card p-10 flex flex-col justify-between min-h-[180px] relative overflow-hidden border-studelle-burgundy/10 shadow-xl">
           <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-[0.3em] text-studelle-burgundy/50">IP Kumulatif</p>
              <h4 className="text-7xl font-serif font-bold text-studelle-burgundy tracking-tighter">{ipk.toFixed(2)}</h4>
           </div>
           <div className="absolute top-0 right-0 p-6 opacity-5">
              <Star size={80} />
           </div>
           <div className="w-fit bg-studelle-gold/10 px-5 py-2 rounded-xl text-[10px] font-bold text-studelle-gold tracking-widest">
              Evaluasi Terpusat
           </div>
        </div>

        <div className="studelle-card p-10 flex flex-col justify-between min-h-[180px] relative overflow-hidden bg-white/5 shadow-xl border-white/10">
           <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-[0.3em] text-white/50">SKS Terselesaikan</p>
              <h4 className="text-7xl font-serif font-bold text-studelle-gold tracking-tighter">{totalSKS}</h4>
           </div>
           <div className="absolute top-0 right-0 p-6 opacity-10">
              <Award size={80} />
           </div>
           <div className="w-fit bg-white/10 text-white px-5 py-2 rounded-xl text-[10px] font-bold tracking-widest border border-white/10">
              Target 144 SKS
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form Card */}
        <div className="studelle-card p-10 space-y-10 h-fit shadow-2xl">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-studelle-burgundy text-white rounded-2xl flex items-center justify-center shadow-lg">
                 <Plus size={24} />
              </div>
              <div>
                 <h3 className="text-2xl font-serif font-bold text-studelle-burgundy leading-none">Input Capaian</h3>
                 <p className="text-sm font-medium tracking-wide text-studelle-burgundy/40 mt-1.5">Registrasi Nilai Akademik Baru</p>
              </div>
           </div>

           <div className="space-y-8">
              <div className="space-y-3">
                 <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Matakuliah</label>
                 <select 
                   value={formData.courseId}
                   onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                   className="studelle-input appearance-none cursor-pointer bg-studelle-cream border-studelle-burgundy/20"
                 >
                    <option value="">Klik untuk memilih...</option>
                    {activeCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                 </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Index (Grade)</label>
                    <select 
                      value={formData.letterGrade}
                      onChange={(e) => setFormData({...formData, letterGrade: e.target.value})}
                      className="studelle-input appearance-none cursor-pointer bg-studelle-cream border-studelle-burgundy/20"
                    >
                       {Object.keys(gradeMapping).map(g => (
                         <option key={g} value={g}>{g}</option>
                       ))}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Nilai Mutu</label>
                    <div className="studelle-input bg-studelle-burgundy/5 border-none h-14 flex items-center justify-center font-bold text-xl text-studelle-burgundy/40">
                       {gradeMapping[formData.letterGrade]?.toFixed(2)}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                    <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Bobot SKS</label>
                    <div className="studelle-input bg-studelle-burgundy/5 border-none h-14 flex items-center justify-center font-bold text-xl text-studelle-burgundy/40">
                       {selectedCourse?.sks || 0}
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Total Nilai Mutu</label>
                    <div className="studelle-input bg-studelle-burgundy/10 border-none h-14 flex items-center justify-center font-bold text-xl text-studelle-accent">
                       {((selectedCourse?.sks || 0) * (gradeMapping[formData.letterGrade] || 0)).toFixed(2)}
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-bold tracking-wide text-studelle-burgundy/60 ml-2">Status Kelulusan</label>
                 <select 
                   value={formData.status}
                   onChange={(e) => setFormData({...formData, status: e.target.value})}
                   className="studelle-input appearance-none cursor-pointer bg-studelle-cream border-studelle-burgundy/5"
                 >
                    <option>Lulus (LL)</option>
                    <option>Tidak Lulus (TL)</option>
                 </select>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={submitting || !formData.courseId}
                className="studelle-button w-full h-14"
              >
                 {submitting ? <Loader2 size={24} className="animate-spin" /> : (editingId ? "Perbarui Capaian" : "Simpan Capaian")}
              </button>
              {editingId && (
                <button 
                  onClick={resetForm}
                  className="w-full text-[10px] font-bold tracking-widest text-studelle-burgundy/40 uppercase hover:text-studelle-burgundy transition-colors"
                >
                  Batal Edit
                </button>
              )}
           </div>
        </div>

        {/* Table Card */}
        <div className="lg:col-span-2 space-y-6">
           <div className="studelle-card shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-studelle-burgundy/10">
              <div className="p-10 bg-studelle-burgundy/[0.01] border-b border-studelle-burgundy/5 flex justify-between items-center">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-studelle-burgundy/5 rounded-[1.25rem] flex items-center justify-center text-studelle-burgundy shadow-inner">
                       <FileSpreadsheet size={28} />
                    </div>
                    <div>
                       <h3 className="text-3xl font-serif font-bold text-studelle-burgundy leading-none">Semester {activeSem}</h3>
                       <p className="text-sm font-medium tracking-wide text-studelle-burgundy/40 mt-1.5">Verifikasi Sistem Akademik Terintegrasi</p>
                    </div>
                 </div>
                 <div className="bg-studelle-burgundy text-white px-8 py-3 rounded-2xl text-[10px] font-bold tracking-widest shadow-xl flex items-center gap-4">
                    <span>{totalSKSActive} SKS Terproses</span>
                    <div className="w-px h-4 bg-white/20" />
                    <button onClick={handleDownloadPDF} className="hover:text-studelle-gold transition-colors uppercase">Cetak</button>
                 </div>
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
                       {activeGrades.length > 0 ? (
                         activeGrades.map((grade) => (
                           <tr key={grade.id} className="group hover:bg-studelle-burgundy/[0.01] transition-colors">
                              <td className="px-12 py-10">
                                 <p className="text-sm font-bold text-studelle-burgundy/60 tracking-wider uppercase">{grade.courseCode || '-'}</p>
                              </td>
                              <td className="px-12 py-10">
                                 <p className="text-lg font-serif font-bold text-studelle-burgundy tracking-tight italic">{grade.courseName}</p>
                              </td>
                              <td className="px-12 py-10 text-center text-base font-bold text-studelle-burgundy/40 tracking-widest">{grade.sks}</td>
                              <td className="px-12 py-10 text-center">
                                 <span className="text-4xl font-serif font-bold text-studelle-accent tracking-tighter leading-none">{grade.letterGrade}</span>
                              </td>
                              <td className="px-12 py-10 text-center">
                                 <p className="text-2xl font-serif font-bold text-studelle-burgundy/60 leading-none">{grade.point?.toFixed(2)}</p>
                              </td>
                              <td className="px-12 py-10 text-center">
                                 <p className="text-2xl font-serif font-bold text-studelle-gold leading-none">{grade.totalPoint?.toFixed(2)}</p>
                              </td>
                              <td className="px-12 py-10 text-center">
                                 <span className={cn(
                                   "text-[10px] font-bold px-4 py-1.5 rounded-xl tracking-widest uppercase shadow-sm border",
                                   grade.status?.includes('TL') 
                                     ? "bg-red-50 text-red-500 border-red-100" 
                                     : "bg-studelle-burgundy text-white border-studelle-burgundy"
                                 )}>
                                   {grade.status?.includes('TL') ? 'TL' : 'LL'}
                                 </span>
                              </td>
                              <td className="px-12 py-10 text-right">
                                 <div className="flex justify-end gap-3 transition-all">
                                    <button 
                                      onClick={() => handleEdit(grade)}
                                      title="Edit Nilai"
                                      className="w-12 h-12 rounded-2xl bg-studelle-burgundy/5 flex items-center justify-center text-studelle-burgundy/20 hover:text-studelle-gold hover:bg-white transition-all shadow-sm border border-transparent hover:border-studelle-gold/20"
                                    >
                                       <Edit2 size={20} />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if(window.confirm('Hapus rincian nilai ini?')) {
                                          handleDelete(grade.id);
                                        }
                                      }}
                                      title="Hapus Nilai"
                                      className="w-12 h-12 rounded-2xl bg-studelle-burgundy/5 flex items-center justify-center text-studelle-burgundy/20 hover:text-red-500 hover:bg-white transition-all shadow-sm border border-transparent hover:border-red-100"
                                    >
                                       <Trash2 size={20} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                         ))
                       ) : (
                         <tr>
                            <td colSpan={8} className="px-12 py-40 text-center space-y-8">
                               <div className="w-24 h-24 bg-studelle-burgundy/5 rounded-[3rem] mx-auto flex items-center justify-center text-studelle-burgundy/10 shadow-inner">
                                  <GraduationCap size={48} />
                               </div>
                               <p className="text-xl font-serif font-medium text-studelle-burgundy/40">Belum ada rincian nilai di Semester {activeSem}.</p>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      <footer className="pt-12 border-t border-white/5 text-center">
        <p className="text-[11px] font-medium tracking-[0.1em] text-white/20">
          Studelle Royale Sanctuary © 2026 — Semua data KHS telah divalidasi sistem
        </p>
      </footer>
    </div>
  );
};

export default GradeCard;
