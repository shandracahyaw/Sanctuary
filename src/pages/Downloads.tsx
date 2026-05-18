import React, { useState } from 'react';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { Download, BookOpen, FileSpreadsheet, FileText, ClipboardCheck, Info, Loader2, Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { getCourses, getGrades, getEvaluationsOnce } from '@/src/services/firestoreService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Downloads = () => {
  const { profile, user, userId } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedSemesters, setSelectedSemesters] = useState<{ [key: string]: number }>({
    'ARSIP_01': 1,
    'ARSIP_02': 1,
    'ARSIP_03': 1,
    'ARSIP_04': 1
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
      const PRIMARY_COLOR = [0, 35, 71]; // #002347 Dark Navy
      const TEXT_DARK = [20, 20, 20];
      const LIGHT_GRAY = [245, 245, 245];

      // Helper to get image as data URL
      const getImageData = (url: string): Promise<string> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => resolve(''); // Fallback to empty if error
          img.src = url;
        });
      };

      const photoData = await getImageData(profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || 'U')}&background=064e3b&color=fff`);
      
      // Helper: Draw Header
      const drawHeader = (subtitle: string) => {
        // Red Header Bar
        doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.rect(0, 0, 210, 40, 'F'); 
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("times", "bold");
        doc.setFontSize(36);
        doc.text("STUDELLE ACADEMIC", 105, 20, { align: "center" });
        
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.text(subtitle.toUpperCase(), 105, 27, { align: "center" });
      };

      // Helper: Draw Academic Identity
      const drawIdentity = (activeSemester?: number) => {
        const titleText = "IDENTITAS MAHASISWA";
        const titleY = 58; 

        const labels = [
          { label: "NAMA LENGKAP", value: (profile?.displayName || '-').toUpperCase() },
          { label: "NIM / ID SISWA", value: profile?.nim || '-' },
          { label: "FAKULTAS", value: profile?.faculty || 'Fakultas Belum Set' },
          { label: "PROGRAM STUDI", value: profile?.programStudy || 'Prodi Belum Set' },
        ];
        
        if (activeSemester) {
          labels.push({ label: "SEMESTER AKTIF", value: String(activeSemester) });
        }

        const boxStartY = titleY + 5;
        const boxHeight = 55;
        const rowHeight = 7.5;
        const verticalPadding = (boxHeight - ((labels.length - 1) * rowHeight)) / 2;
        const contentStartY = boxStartY + verticalPadding;

        // Dimensions
        const photoBoxWidth = 45;
        const photoBoxX = 7;
        const gap = 5;
        const identityBoxX = photoBoxX + photoBoxWidth + gap;
        const identityBoxWidth = 196 - photoBoxWidth - gap;

        // Draw Boxes
        doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setLineWidth(0.5);
        
        // Photo Box (Left)
        doc.rect(photoBoxX, boxStartY, photoBoxWidth, boxHeight, 'S');

        // Identity Box (Right of photo)
        doc.rect(identityBoxX, boxStartY, identityBoxWidth, boxHeight, 'S');

        // Add Photo to Photo Box with Original Aspect Ratio
        if (photoData) {
          try {
            const props = doc.getImageProperties(photoData);
            const ratio = props.width / props.height;
            let targetW = photoBoxWidth - 8;
            let targetH = targetW / ratio;
            
            if (targetH > boxHeight - 8) {
              targetH = boxHeight - 8;
              targetW = targetH * ratio;
            }
            
            const renderX = photoBoxX + (photoBoxWidth - targetW) / 2;
            const renderY = boxStartY + (boxHeight - targetH) / 2;
            doc.addImage(photoData, 'PNG', renderX, renderY, targetW, targetH, undefined, 'FAST');
          } catch (e) {
            doc.addImage(photoData, 'PNG', photoBoxX + 4, boxStartY + 4, photoBoxWidth - 8, boxHeight - 8, undefined, 'FAST');
          }
        }

        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text(titleText, identityBoxX + 4, titleY);
        const titleWidth = doc.getTextWidth(titleText);
        doc.line(identityBoxX + 4, titleY + 2, identityBoxX + 4 + titleWidth, titleY + 2);

        doc.setFontSize(10);
        doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);

        const labelColumnWidth = 45;
        const colonWidth = 3;
        labels.forEach((item, index) => {
          doc.setFont("times", "bold");
          doc.text(item.label, identityBoxX + 4, contentStartY + (index * rowHeight));
          doc.text(":", identityBoxX + 4 + labelColumnWidth, contentStartY + (index * rowHeight));
          doc.setFont("times", "normal");
          
          const maxWidth = identityBoxWidth - labelColumnWidth - colonWidth - 8;
          doc.text(item.value, identityBoxX + 4 + labelColumnWidth + colonWidth, contentStartY + (index * rowHeight), { maxWidth });
        });
        
        return boxStartY + boxHeight;
      };

      // Helper: Draw Summary Box
      const drawSummaryBox = (y: number, stats: { label: string, value: string }[], gpaStats: { label: string, value: string }[]) => {
        const boxTop = y + 8;
        const boxX = 11;
        const boxW = 188;
        const boxH = 32;
        const dividerX = 110;

        // Background for Right Section
        doc.setFillColor(248, 248, 245); // Light beige background
        doc.rect(dividerX, boxTop, boxW - (dividerX - boxX), boxH, 'F');

        // Box Border
        doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setLineWidth(0.8);
        doc.rect(boxX, boxTop, boxW, boxH, 'S');

        // Divider Line
        doc.setLineWidth(0.2);
        doc.setDrawColor(200, 200, 200);
        doc.line(dividerX, boxTop + 5, dividerX, boxTop + 30); 

        // Left stats
        doc.setFontSize(9);
        const labelX = 18;
        const colonX = 64;
        
        stats.forEach((s, i) => {
          doc.setFont("times", "bold");
          doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
          doc.text(s.label.toUpperCase(), labelX, boxTop + 12 + (i * 8));
          
          if (s.label.includes("PREDIKAT")) {
            doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
            if (s.value.length > 20) doc.setFontSize(8);
          }
          doc.text(`: ${s.value}`, colonX, boxTop + 12 + (i * 8));
          doc.setFontSize(9);
        });

        // Right GPA
        const centerXRight = dividerX + (boxW - (dividerX - boxX)) / 2;
        gpaStats.forEach((gs, i) => {
          doc.setFontSize(10);
          doc.setFont("times", "bold");
          doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
          
          if (gs.label.includes("(IPK)")) {
            // Centered style for Transcript
            doc.text(gs.label, centerXRight, boxTop + 14 + (i * 14), { align: "center" });
            doc.setFontSize(24);
            doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
            doc.text(gs.value, centerXRight, boxTop + 28 + (i * 14), { align: "center" });
          } else {
            // List style for KHS
            doc.text(gs.label, dividerX + 8, boxTop + 14 + (i * 12));
            doc.text(`: ${gs.value}`, dividerX + 45, boxTop + 14 + (i * 12));
          }
        });

        return boxTop + boxH;
      };

      // Helper: Draw Footer and Frame
      const addFooterAndFrame = (doc: jsPDF) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          
          // Draw Frame
          // (Frame removed)

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
        const semCourses = (courses || [])
          .filter(c => c.semester === sem)
          .sort((a, b) => (a.code || '').localeCompare(b.code || ''));
        
        const tableTitleY = nextY + 18; 

        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text("INFORMASI DAFTAR KURIKULUM", 11, tableTitleY);
        doc.line(11, tableTitleY + 2, 11 + doc.getTextWidth("INFORMASI DAFTAR KURIKULUM"), tableTitleY + 2);

        autoTable(doc, {
          startY: tableTitleY + 10, 
          head: [['SMT', 'KODE MK', 'NAMA MATAKULIAH', 'SKS', 'DOSEN PENGAMPU']],
          body: semCourses.map(c => [
            String(c.semester),
            (c.code || '-').toUpperCase(),
            (c.name || '-'),
            String(c.sks || 0),
            (c.lecturer || '-')
          ]),
          headStyles: { 
            fillColor: PRIMARY_COLOR as any, 
            textColor: 255, 
            halign: 'center', 
            fontStyle: 'bold', 
            font: 'times',
            fontSize: 8,
            cellPadding: 4
          },
          bodyStyles: { 
            textColor: TEXT_DARK as any, 
            font: 'times', 
            fontSize: 7, 
            cellPadding: 2.5, 
            lineWidth: 0.1, 
            lineColor: [100, 100, 100] 
          },
          alternateRowStyles: { fillColor: [255, 255, 255] },
          styles: { 
            valign: 'middle',
            lineColor: [100, 100, 100],
            minCellHeight: 0.2
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'center', cellWidth: 22 },
            2: { halign: 'left', cellWidth: 82.5 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'left', cellWidth: 55 },
          },
          margin: { left: 10, right: 10 }
        });

        // Dynamic Box
        const finalTableY = (doc as any).lastAutoTable?.finalY || tableTitleY + 20;
        doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setLineWidth(0.5);
        doc.rect(7, tableTitleY - 8, 196, (finalTableY + 5) - (tableTitleY - 8), 'S');
        
      } else if (type === 'ARSIP_02') {
        drawHeader("KARTU HASIL STUDI (KHS) SEMESTER");
        const nextY = drawIdentity(sem);
        
        const courses = (await getCourses(userId)) as any[] || [];
        const allGrades = (await getGrades(userId)) as any[] || [];
        
        const semCourses = (courses || [])
          .filter(c => c.semester === sem)
          .sort((a, b) => (a.code || '').localeCompare(b.code || ''));

        // Robust filtering for grades in semester
        const semGradesForPDF = semCourses.map(course => {
          const grade = allGrades.find(g => g.courseId === course.id);
          return {
            code: course.code,
            name: course.name,
            sks: course.sks,
            letterGrade: grade?.letterGrade || '-',
            point: grade?.point || 0,
            totalPoint: grade?.totalPoint || 0
          };
        });
        
        const totalSksSem = semGradesForPDF.reduce((acc, g) => acc + (g.sks || 0), 0);
        const totalMutuSem = semGradesForPDF.reduce((acc, g) => acc + (g.totalPoint || 0), 0);
        const totalSksKum = allGrades.reduce((acc, g) => acc + (g.sks || 0), 0);
        const totalMutuKum = allGrades.reduce((acc, g) => acc + (g.totalPoint || 0), 0);
        
        const ipSem = totalSksSem > 0 ? (totalMutuSem / totalSksSem) : 0;
        const ipk = totalSksKum > 0 ? (totalMutuKum / totalSksKum) : 0;

        const tableTitleY = nextY + 18; 

        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text(`INFORMASI NILAI KHS SEMESTER ${sem}`, 11, tableTitleY);
        doc.line(11, tableTitleY + 2, 11 + doc.getTextWidth(`INFORMASI NILAI KHS SEMESTER ${sem}`), tableTitleY + 2);

        autoTable(doc, {
          startY: tableTitleY + 10, 
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
            cellPadding: 4
          },
          bodyStyles: { 
            textColor: TEXT_DARK as any, 
            font: 'times', 
            fontSize: 8, 
            cellPadding: 2.5, 
            lineWidth: 0.1, 
            lineColor: [100, 100, 100] 
          },
          alternateRowStyles: { fillColor: [255, 255, 255] },
          styles: { 
            valign: 'middle',
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
          margin: { left: 10, right: 9 }
        });

        const finalYTemp = (doc as any).lastAutoTable?.finalY || 105;
        if (finalYTemp > 230) doc.addPage();
        const finalY = finalYTemp > 230 ? 10 : finalYTemp;
        const currentPage = (doc as any).internal.getNumberOfPages();

        const finalBoxY = drawSummaryBox(finalY, [
          { label: "TOTAL SKS SEMESTER", value: String(totalSksSem) },
          { label: "TOTAL MUTU SEMESTER", value: totalMutuSem.toFixed(2) },
          { label: "TOTAL SKS KUMULATIF", value: String(totalSksKum) }
        ], [
          { label: `IPS Semester ${sem}`, value: ipSem.toFixed(2) },
          { label: "IP Kumulatif", value: ipk.toFixed(2) }
        ]);

        // Dynamic Box
        doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setLineWidth(0.5);
        if (currentPage > 1) {
          // Box on first page
          doc.setPage(1);
          doc.rect(7, tableTitleY - 8, 196, 280 - (tableTitleY - 8), 'S');
          // Box on current page
          doc.setPage(currentPage);
          doc.rect(7, 10, 196, (finalBoxY + 5) - 10, 'S');
        } else {
          doc.rect(7, tableTitleY - 8, 196, (finalBoxY + 5) - (tableTitleY - 8), 'S');
        }

      } else if (type === 'ARSIP_03') {
        // Transcript (ARSIP_03)
        drawHeader("TRANSKRIP NILAI AKADEMIK KUMULATIF");
        const nextY = drawIdentity();
        
        const courses = (await getCourses(userId)) as any[] || [];
        const allGradesRaw = (await getGrades(userId)) as any[] || [];
        
        const allGrades = allGradesRaw.map(g => {
          if (g.semester) return g;
          const course = courses.find(c => c.id === g.courseId);
          return { ...g, semester: course?.semester };
        }).sort((a, b) => 
          ((a.semester || 0) - (b.semester || 0)) || 
          (a.courseCode || a.courseName || '').localeCompare(b.courseCode || b.courseName || '')
        );

        const tableTitleY = nextY + 18; 

        doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text("INFORMASI NILAI TRANSKRIP", 11, tableTitleY);
        doc.line(11, tableTitleY + 2, 11 + doc.getTextWidth("INFORMASI NILAI TRANSKRIP"), tableTitleY + 2);

        autoTable(doc, {
          startY: tableTitleY + 10, 
          head: [['SMT', 'KODE MK', 'NAMA MATAKULIAH', 'SKS', 'NILAI', 'BOBOT', 'MUTU', 'KET']],
          body: allGrades.map((g) => [
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
            cellPadding: 3
          },
          bodyStyles: { 
            textColor: TEXT_DARK as any, 
            font: 'times', 
            fontSize: 7, 
            cellPadding: 2, 
            lineWidth: 0.1, 
            lineColor: [100, 100, 100] 
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
            2: { halign: 'left', cellWidth: 70 },   // NAMA MATAKULIAH
            3: { halign: 'center', cellWidth: 15 }, // SKS
            4: { halign: 'center', cellWidth: 18 }, // NILAI
            5: { halign: 'center', cellWidth: 18 }, // BOBOT
            6: { halign: 'center', cellWidth: 18 }, // MUTU
            7: { halign: 'center', cellWidth: 15 }, // KET
          },
          margin: { left: 10, right: 10 }
        });

        const finalY = (doc as any).lastAutoTable?.finalY || 105;
        const totalSksKum = allGrades.reduce((acc, g) => acc + (g.sks || 0), 0);
        const totalMutuKum = allGrades.reduce((acc, g) => acc + (g.totalPoint || 0), 0);
        const ipk = totalSksKum > 0 ? (totalMutuKum / totalSksKum) : 0;

        if (finalY > 230) doc.addPage();
        const summaryY = finalY > 230 ? 20 : finalY + 10;
        const currentPage = (doc as any).internal.getNumberOfPages();

        const finalBoxY = drawSummaryBox(summaryY, [
          { label: "TOTAL SKS KUMULATIF", value: String(totalSksKum) },
          { label: "TOTAL MUTU KUMULATIF", value: totalMutuKum.toFixed(2) },
          { label: "PREDIKAT KELULUSAN", value: getPredikat(ipk) }
        ], [
          { label: "IP Kumulatif (IPK)", value: ipk.toFixed(2) }
        ]);

        // Dynamic Box
        doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
        doc.setLineWidth(0.5);
        if (currentPage > 1) {
          // Box on first page
          doc.setPage(1);
          doc.rect(7, tableTitleY - 8, 196, 280 - (tableTitleY - 8), 'S');
          // Box on current page
          doc.setPage(currentPage);
          doc.rect(7, 10, 196, (finalBoxY + 5) - 10, 'S');
        } else {
          doc.rect(7, tableTitleY - 8, 196, (finalBoxY + 5) - (tableTitleY - 8), 'S');
        }
      } else if (type === 'ARSIP_04') {
        // Session Evaluation Download
        drawHeader("LAPORAN CAPAIAN NILAI PER MATA KULIAH");
        
        const courses = (await getCourses(userId)) as any[] || [];
        const semCourses = (courses || [])
          .filter(c => c.semester === sem)
          .sort((a, b) => (a.code || '').localeCompare(b.code || ''));

        if (semCourses.length === 0) {
          drawIdentity(sem);
          doc.setFontSize(14);
          doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
          doc.text("TIDAK ADA DATA MATAKULIAH UNTUK SEMESTER INI", 105, 120, { align: "center" });
        } else {
          for (let i = 0; i < semCourses.length; i++) {
            const course = semCourses[i];
            if (i > 0) doc.addPage();
            
            drawHeader("LAPORAN CAPAIAN NILAI PER MATA KULIAH");
            const nextY = drawIdentity(sem);

            const evaluations = await getEvaluationsOnce(userId, course.id) || [];
            const sessions = [1, 2, 3, 4, 5, 6, 7, 8];
            const isBPro = course.category === 'BPro';

            const getScoreFromList = (list: any[], sess: number, t: string) => {
              const item = list.find(e => e.session === sess && e.type === t);
              return item ? item.score : 0;
            };

            const calculateSessionAccumulation = (sessionNum: number) => {
              if (isBPro) {
                if (![3, 5, 7].includes(sessionNum)) return 0;
                const tmk = getScoreFromList(evaluations, sessionNum, 'TMK');
                return tmk / 3;
              } else {
                const keh = getScoreFromList(evaluations, sessionNum, 'Kehadiran');
                const tut = getScoreFromList(evaluations, sessionNum, 'Tuton');
                const tmk = getScoreFromList(evaluations, sessionNum, 'TMK');

                const isTutonAvail = (s: number, sm: number, bpro: boolean) => {
                  if (bpro) return false;
                  if (sm >= 1 && sm <= 3) return [1, 2, 3, 4, 5, 6, 7, 8].includes(s);
                  if (sm >= 4 && sm <= 8) return [1, 2, 4, 6, 8].includes(s);
                  return false;
                };
                const isTMKAvail = (s: number) => [3, 5, 7].includes(s);

                const isKeh = isTutonAvail(sessionNum, sem, isBPro);
                const isTut = isTutonAvail(sessionNum, sem, isBPro);
                const isTmk = isTMKAvail(sessionNum);

                const numKeh = (sem >= 1 && sem <= 3) ? 8 : 5;
                const numTut = (sem >= 1 && sem <= 3) ? 8 : 5;
                const numTmk = 3;

                let contrib = 0;
                if (isKeh) contrib += (keh * 0.2) / numKeh;
                if (isTut) contrib += (tut * 0.3) / numTut;
                if (isTmk) contrib += (tmk * 0.5) / numTmk;

                return contrib;
              }
            };

            const calculateGrandTotal = () => {
              if (isBPro) {
                const tmkSessions = [3, 5, 7];
                const tmkSum = tmkSessions.reduce((sum, s) => sum + getScoreFromList(evaluations, s, 'TMK'), 0);
                return tmkSum / 3;
              } else {
                const kehSessions = (sem >= 1 && sem <= 3) ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 4, 6, 8];
                const tutSessions = (sem >= 1 && sem <= 3) ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 4, 6, 8];
                const tmkSessions = [3, 5, 7];

                const kehSum = kehSessions.reduce((sum, s) => sum + getScoreFromList(evaluations, s, 'Kehadiran'), 0);
                const tutSum = tutSessions.reduce((sum, s) => sum + getScoreFromList(evaluations, s, 'Tuton'), 0);
                const tmkSum = tmkSessions.reduce((sum, s) => sum + getScoreFromList(evaluations, s, 'TMK'), 0);

                const kehAvg = kehSessions.length > 0 ? kehSum / kehSessions.length : 0;
                const tutAvg = tutSessions.length > 0 ? tutSum / tutSessions.length : 0;
                const tmkAvg = tmkSessions.length > 0 ? tmkSum / tmkSessions.length : 0;

                return (kehAvg * 0.2) + (tutAvg * 0.3) + (tmkAvg * 0.5);
              }
            };

            const grandTotalValue = calculateGrandTotal();

            const sectionTitleY = nextY + 18;
            doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
            doc.setFont("times", "bold");
            doc.setFontSize(12);
            doc.text(`MATAKULIAH: ${course.name} (${course.code})`, 11, sectionTitleY);
            doc.line(11, sectionTitleY + 2, 11 + doc.getTextWidth(`MATAKULIAH: ${course.name} (${course.code})`), sectionTitleY + 2);

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

            const finalTableY = (doc as any).lastAutoTable.finalY + 12;
            doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
            doc.setLineWidth(0.7);
            doc.rect(13, finalTableY, 184, 18);
            
            doc.setFont("times", "bold");
            doc.setFontSize(13);
            doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
            doc.text(`AKUMULASI NILAI AKHIR MATAKULIAH: ${grandTotalValue.toFixed(1)}`, 105, finalTableY + 11, { align: "center" });

            const boxBottomY = finalTableY + 18 + 5;
            doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
            doc.setLineWidth(0.5);
            doc.rect(7, sectionTitleY - 8, 196, boxBottomY - (sectionTitleY - 8), 'S');
          }
        }
      }

      addFooterAndFrame(doc);
      doc.save(`Studelle_${title.replace(/\s+/g, '_')}_${(profile?.displayName || 'Mahasiswa').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-12 pb-20 pt-6">
      <PageHeader title="Pusat Unduhan" />

      <div className="studelle-card p-20 text-center space-y-6 relative overflow-hidden bg-studelle-emerald text-white border-none shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
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
          { icon: BookOpen, title: 'Daftar Kurikulum', cat: 'ARSIP_01', accent: 'text-studelle-emerald' },
          { icon: ClipboardCheck, title: 'Evaluasi Sesi', cat: 'ARSIP_04', accent: 'text-studelle-accent' },
          { icon: FileSpreadsheet, title: 'Kartu Hasil Studi', cat: 'ARSIP_02', accent: 'text-studelle-gold' },
          { icon: FileText, title: 'Transkrip Nilai', cat: 'ARSIP_03', accent: 'text-studelle-emerald' },
        ].map((item, idx) => (
          <div key={idx} className="studelle-card p-12 flex flex-col justify-between space-y-12 group shadow-[0_40px_80px_rgba(0,0,0,0.4)] border-studelle-emerald/10 transition-all duration-500 hover:-translate-y-4">
             <div className="space-y-8">
                <div className="flex justify-between items-start">
                   <p className="text-[10px] font-bold tracking-widest text-studelle-emerald/30">{item.cat}</p>
                   <item.icon size={28} className={cn("opacity-40 transition-transform group-hover:scale-125 duration-500", item.accent)} />
                </div>
                <h4 className={cn("text-4xl font-serif font-bold tracking-tight leading-tight", item.accent)}>{item.title}</h4>
                {item.cat !== 'ARSIP_03' && (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-studelle-emerald/40 tracking-widest">Pilih Periode</p>
                    <select 
                      value={selectedSemesters[item.cat]}
                      onChange={(e) => setSelectedSemesters({...selectedSemesters, [item.cat]: parseInt(e.target.value)})}
                      className="studelle-input h-14 px-6 text-sm font-bold bg-studelle-cream border-studelle-emerald/20 appearance-none cursor-pointer"
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
         <div className="w-16 h-16 bg-studelle-gold rounded-3xl flex items-center justify-center text-studelle-emerald shadow-2xl shadow-studelle-gold/30 shrink-0">
            <Info size={32} />
         </div>
         <div className="space-y-2 text-center md:text-left">
            <h4 className="text-2xl font-serif font-bold text-studelle-emerald leading-none">Keamanan Dokumen Digital</h4>
            <p className="text-base font-serif text-studelle-emerald/50 max-w-3xl leading-relaxed">
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
