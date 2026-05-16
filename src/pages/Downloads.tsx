import React, { useState } from 'react';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { Download, BookOpen, FileSpreadsheet, FileText, ClipboardCheck, Info, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { getCourses, getGrades } from '@/src/services/firestoreService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Downloads = () => {
  const { profile, user, userId } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedSemesters, setSelectedSemesters] = useState<{ [key: string]: number }>({
    'ARSIP_01': 1,
    'ARSIP_02': 1,
    'ARSIP_03': 1
  });

  const getPredikat = (ipk: number) => {
    if (ipk >= 3.51) return "DENGAN PUJIAN (CUMLAUDE)";
    if (ipk >= 3.01) return "SANGAT MEMUASKAN";
    if (ipk >= 2.76) return "MEMUASKAN";
    if (ipk >= 2.00) return "CUKUP";
    return "KURANG";
  };

  const handleDownload = async (type: string, title: string) => {
    if (!userId) return;
    setDownloading(type);
    
    try {
      const doc = new jsPDF();
      const sem = selectedSemesters[type];
      const PRIMARY_COLOR = [92, 10, 40]; // #5C0A28 Burgundy
      const TEXT_DARK = [40, 40, 40];
      const LIGHT_GRAY = [240, 240, 240];
      
      // Helper: Draw Header
      const drawHeader = (subtitle: string) => {
        // Red Header Bar
        doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("times", "bold");
        doc.setFontSize(32);
        doc.text("STUDELLE ACADEMIC", 105, 22, { align: "center" });
        
        doc.setFont("times", "italic");
        doc.setFontSize(10);
        doc.text(subtitle, 105, 30, { align: "center" });
      };

      // Helper: Draw Academic Identity
      const drawIdentity = (activeSemester?: number) => {
        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.text("INFORMASI IDENTITAS AKADEMIK", 20, 52);
        doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setLineWidth(0.5);
        doc.line(20, 54, 110, 54);

        doc.setFontSize(10);
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
        
        const startY = 65;
        const labels = [
          { label: "NAMA LENGKAP", value: profile?.displayName || '-' },
          { label: "NIM / ID SISWA", value: profile?.nim || '-' },
          { label: "FAKULTAS", value: profile?.faculty || 'Fakultas Sains dan Teknologi' },
          { label: "PROGRAM STUDI", value: profile?.programStudy || 'Sistem Informasi' },
        ];
        
        if (activeSemester) {
          labels.push({ label: "SEMESTER AKTIF", value: String(activeSemester) });
        }

        labels.forEach((item, index) => {
          doc.setFont("times", "bold");
          doc.text(item.label, 20, startY + (index * 7));
          doc.text(":", 65, startY + (index * 7));
          doc.setFont("times", "normal");
          doc.text(item.value, 68, startY + (index * 7));
        });
        
        return startY + (labels.length * 7) + 5;
      };

      // Helper: Draw Summary Box
      const drawSummaryBox = (y: number, stats: { label: string, value: string }[], gpaStats: { label: string, value: string }[]) => {
        const boxTop = y + 10;
        doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setLineWidth(1);
        doc.rect(20, boxTop, 170, 32);
        doc.line(100, boxTop + 5, 100, boxTop + 27); // vertical divider

        // Left stats
        doc.setFontSize(9);
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
        stats.forEach((s, i) => {
          doc.setFont("times", "bold");
          doc.text(`${s.label}: ${s.value}`, 25, boxTop + 10 + (i * 7));
        });

        // Right GPA
        gpaStats.forEach((gs, i) => {
          doc.setFontSize(10);
          doc.setFont("times", "bold");
          doc.text(gs.label, 110, boxTop + 10 + (i * 12));
          doc.setFontSize(22);
          doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
          doc.text(gs.value, 165, boxTop + 11 + (i * 12), { align: "right" });
        });
      };

      // Helper: Draw Footer and Frame
      const addFooterAndFrame = (doc: jsPDF) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Draw Frame
          doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
          doc.setLineWidth(0.1);
          doc.rect(10, 10, 190, 277, 'S');

          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.setFont("times", "normal");
          const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          doc.text(`Dokumen ini dicetak secara otomatis melalui Studelle System pada: ${dateStr} pukul ${timeStr}`, 105, 285, { align: "center" });
        }
      };

      if (type === 'ARSIP_01') {
        drawHeader("STUDENT DEVELOPMENT LEARNING EVALUATION ENVIRONMENT");
        const nextY = drawIdentity(sem);
        
        const courses = (await getCourses(userId)) as any[];
        const semCourses = courses
          ?.filter(c => c.semester === sem)
          .sort((a, b) => (a.code || '').localeCompare(b.code || '')) || [];
        
        autoTable(doc, {
          startY: nextY + 5,
          head: [['KODE', 'NAMA MATAKULIAH', 'JENIS', 'BOBOT (SKS)', 'DOSEN']],
          body: semCourses.map(c => [
            c.code || '-',
            c.name || '-',
            c.type || 'Wajib',
            String(c.sks || 0),
            c.lecturer || '-'
          ]),
          headStyles: { fillColor: PRIMARY_COLOR as any, textColor: 255, halign: 'center', fontStyle: 'bold', font: 'times' },
          bodyStyles: { textColor: TEXT_DARK as any, font: 'times' },
          alternateRowStyles: { fillColor: LIGHT_GRAY as any },
          styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
          columnStyles: {
            0: { halign: 'center', cellWidth: 25 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 25 },
            4: { halign: 'left', cellWidth: 45 },
          },
          margin: { left: 20, right: 20 }
        });
        
      } else if (type === 'ARSIP_02') {
        drawHeader("KARTU HASIL STUDI (KHS) SEMESTER");
        const nextY = drawIdentity(sem);
        
        const allGrades = (await getGrades(userId)) as any[];
        const semGrades = allGrades
          ?.filter(g => g.semester === sem)
          .sort((a, b) => (a.courseCode || a.courseName || '').localeCompare(b.courseCode || b.courseName || '')) || [];
        
        const totalSksSem = semGrades.reduce((acc, g) => acc + (g.sks || 0), 0);
        const totalMutuSem = semGrades.reduce((acc, g) => acc + (g.totalPoint || 0), 0);
        const totalSksKum = allGrades.reduce((acc, g) => acc + (g.sks || 0), 0);
        const ipSem = totalSksSem > 0 ? (totalMutuSem / totalSksSem) : 0;
        const totalMutuKum = allGrades.reduce((acc, g) => acc + (g.totalPoint || 0), 0);
        const ipk = totalSksKum > 0 ? (totalMutuKum / totalSksKum) : 0;

        autoTable(doc, {
          startY: nextY + 5,
          head: [['KODE MK', 'MATAKULIAH', 'SKS', 'NILAI', 'BOBOT', 'MUTU', 'KET']],
          body: semGrades.map(g => [
            g.courseCode || '-',
            g.courseName || '-',
            String(g.sks || 0),
            g.letterGrade || '-',
            g.point.toFixed(2),
            g.totalPoint.toFixed(2),
            g.status?.includes('TL') ? 'TL' : 'LL'
          ]),
          headStyles: { fillColor: PRIMARY_COLOR as any, textColor: 255, halign: 'center', fontStyle: 'bold', font: 'times' },
          bodyStyles: { textColor: TEXT_DARK as any, font: 'times' },
          alternateRowStyles: { fillColor: LIGHT_GRAY as any },
          styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
          columnStyles: {
            0: { halign: 'center', cellWidth: 25 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'center', cellWidth: 15 },
            5: { halign: 'center', cellWidth: 15 },
            6: { halign: 'center', cellWidth: 15 },
          },
          margin: { left: 20, right: 20 }
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        drawSummaryBox(finalY, [
          { label: "TOTAL SKS SEMESTER", value: String(totalSksSem) },
          { label: "TOTAL NILAI MUTU SEMESTER", value: totalMutuSem.toFixed(2) },
          { label: "TOTAL SKS KUMULATIF", value: String(totalSksKum) }
        ], [
          { label: "IP Semester:", value: ipSem.toFixed(2) },
          { label: "IP Kumulatif:", value: ipk.toFixed(2) }
        ]);

      } else {
        // Transcript (ARSIP_03)
        drawHeader("TRANSKRIP NILAI AKADEMIK KUMULATIF");
        const nextY = drawIdentity();
        
        const allGrades = (await getGrades(userId)) as any[];
        // Sort by semester then code
        allGrades.sort((a, b) => 
          (a.semester - b.semester) || 
          (a.courseCode || a.courseName || '').localeCompare(b.courseCode || b.courseName || '')
        );

        autoTable(doc, {
          startY: nextY + 5,
          head: [['NO', 'SMT', 'KODE', 'MATAKULIAH', 'SKS', 'NILAI', 'BOBOT', 'MUTU', 'KET']],
          body: allGrades.map((g, i) => [
            String(i + 1),
            `Smt ${g.semester}`,
            g.courseCode || '-',
            g.courseName || '-',
            String(g.sks || 0),
            g.letterGrade || '-',
            g.point.toFixed(2),
            g.totalPoint.toFixed(2),
            g.status?.includes('TL') ? 'TL' : 'LL'
          ]),
          headStyles: { fillColor: PRIMARY_COLOR as any, textColor: 255, halign: 'center', fontStyle: 'bold', font: 'times' },
          bodyStyles: { textColor: TEXT_DARK as any, font: 'times' },
          alternateRowStyles: { fillColor: LIGHT_GRAY as any },
          styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'left' },
            4: { halign: 'center', cellWidth: 10 },
            5: { halign: 'center', cellWidth: 12 },
            6: { halign: 'center', cellWidth: 12 },
            7: { halign: 'center', cellWidth: 12 },
            8: { halign: 'center', cellWidth: 10 },
          },
          margin: { left: 20, right: 20 }
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        const totalSksKum = allGrades.reduce((acc, g) => acc + (g.sks || 0), 0);
        const totalMutuKum = allGrades.reduce((acc, g) => acc + (g.totalPoint || 0), 0);
        const ipk = totalSksKum > 0 ? (totalMutuKum / totalSksKum) : 0;

        if (finalY > 230) doc.addPage();
        const summaryY = finalY > 230 ? 20 : finalY;

        drawSummaryBox(summaryY, [
          { label: "TOTAL SKS KUMULATIF", value: String(totalSksKum) },
          { label: "TOTAL NILAI MUTU KUMULATIF", value: totalMutuKum.toFixed(2) },
          { label: "PREDIKAT KELULUSAN", value: `: ${getPredikat(ipk)}` }
        ], [
          { label: "IP Kumulatif (IPK)", value: ipk.toFixed(2) }
        ]);
      }

      addFooterAndFrame(doc);
      doc.save(`Studelle_${title}_${profile?.displayName}.pdf`);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-12 pb-20 pt-6">
      <PageHeader title="Pusat Unduhan" />

      <div className="studelle-card p-20 text-center space-y-6 relative overflow-hidden bg-studelle-burgundy text-white border-none shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
         <div className="relative z-10">
            <h2 className="text-5xl md:text-6xl font-serif font-bold tracking-tight leading-none">Arsip Digital Terpadu</h2>
            <p className="text-sm font-medium tracking-[0.2em] text-white/40 mt-6 max-w-2xl mx-auto">Sistem Generasi Dokumen Resmi Royale Studelle dengan Enkripsi Digital</p>
         </div>
         <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border-[150px] border-white rounded-full" />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {[
          { icon: BookOpen, title: 'Daftar Kurikulum', cat: 'ARSIP_01', accent: 'text-studelle-burgundy' },
          { icon: FileSpreadsheet, title: 'Kartu Hasil Studi', cat: 'ARSIP_02', accent: 'text-studelle-accent' },
          { icon: FileText, title: 'Transkrip Nilai', cat: 'ARSIP_03', accent: 'text-studelle-gold' },
        ].map((item, idx) => (
          <div key={idx} className="studelle-card p-12 flex flex-col justify-between space-y-12 group shadow-[0_40px_80px_rgba(0,0,0,0.4)] border-studelle-burgundy/10 transition-all duration-500 hover:-translate-y-4">
             <div className="space-y-8">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-bold tracking-widest text-studelle-burgundy/30">{item.cat}</p>
                   <item.icon size={28} className={cn("opacity-40 transition-transform group-hover:scale-125 duration-500", item.accent)} />
                </div>
                <h4 className={cn("text-4xl font-serif font-bold tracking-tight leading-tight", item.accent)}>{item.title}</h4>
                {item.cat !== 'ARSIP_03' && (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-studelle-burgundy/40 tracking-widest">Pilih Periode</p>
                    <select 
                      value={selectedSemesters[item.cat]}
                      onChange={(e) => setSelectedSemesters({...selectedSemesters, [item.cat]: parseInt(e.target.value)})}
                      className="studelle-input h-14 px-6 text-sm font-bold bg-studelle-cream border-studelle-burgundy/20 appearance-none cursor-pointer"
                    >
                        {[1,2,3,4,5,6,7,8].map(i => <option key={i} value={i}>Semester {i}</option>)}
                    </select>
                  </div>
                )}
             </div>
             <button 
               onClick={() => handleDownload(item.cat, item.title)}
               disabled={downloading === item.cat}
               className="studelle-button w-full h-16 flex items-center justify-center gap-4 text-xs font-bold shadow-xl transition-all active:scale-95"
             >
                {downloading === item.cat ? <Loader2 className="animate-spin" size={22} /> : <Download size={22} />}
                <span>{downloading === item.cat ? 'Memproses...' : 'Unduh Dokumen PDF'}</span>
             </button>
          </div>
        ))}
      </div>

      <div className="studelle-card p-10 border-l-[12px] border-studelle-gold flex flex-col md:flex-row items-center gap-8 shadow-2xl">
         <div className="w-16 h-16 bg-studelle-gold rounded-3xl flex items-center justify-center text-studelle-burgundy shadow-2xl shadow-studelle-gold/30 shrink-0">
            <Info size={32} />
         </div>
         <div className="space-y-2 text-center md:text-left">
            <h4 className="text-2xl font-serif font-bold text-studelle-burgundy leading-none">Keamanan Dokumen Digital</h4>
            <p className="text-base font-serif text-studelle-burgundy/50 max-w-3xl leading-relaxed">
              Seluruh berkas yang dihasilkan otomatis oleh sistem Royale Studelle tersemat tanda tangan digital (e-Sign) terverifikasi untuk menjamin otentisitas dokumen akademik anda.
            </p>
         </div>
      </div>

      <footer className="pt-12 border-t border-white/5 text-center">
        <p className="text-[11px] font-medium tracking-[0.1em] text-white/20">
          Studelle Royale Sanctuary © 2026 — Dokumen akademik anda dilindungi secara kriptografis
        </p>
      </footer>
    </div>

  );
};

export default Downloads;
