import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/src/components/ui/PageHeader';
import { Plus, Trash2, Edit3, BookMarked, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { subscribeCourses, addCourse, updateCourse, deleteCourse } from '@/src/services/firestoreService';
import { cn } from '@/src/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    const PRIMARY_COLOR = [0, 35, 71]; // #002347 Dark Navy
    const TEXT_DARK = [20, 20, 20];

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

    // Header Background
    doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.rect(0, 0, 210, 40, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(42);
    doc.text("STUDELLE ACADEMIC", 105, 22, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("STUDENT DEVELOPMENT LEARNING EVALUATION ENVIRONMENT", 105, 32, { align: "center", charSpace: 0.5 });

    // Identity Section title
    doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("INFORMASI IDENTITAS AKADEMIK", 20, 52);
    doc.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
    doc.setLineWidth(0.8);
    const titleWidth = doc.getTextWidth("INFORMASI IDENTITAS AKADEMIK");
    doc.line(20, 54, 20 + titleWidth, 54);

    // Identity Content
    doc.setFontSize(11);
    doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
    const identityLabels = [
      { label: "NAMA LENGKAP", value: (profile?.displayName || '-').toUpperCase() },
      { label: "NIM / ID SISWA", value: (profile?.nim || '-') },
      { label: "FAKULTAS", value: (profile?.faculty || 'Fakultas Belum Set') },
      { label: "PROGRAM STUDI", value: (profile?.programStudy || 'Prodi Belum Set') },
      { label: "SEMESTER AKTIF", value: String(activeSem) },
    ];

    const boxStartY = 60;
    const boxHeight = 55;
    const rowHeight = 7.5;
    const verticalPadding = (boxHeight - ((identityLabels.length - 1) * rowHeight)) / 2;
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

    const labelColumnWidth = 45;
    const colonWidth = 3;
    identityLabels.forEach((item, i) => {
      doc.setFont("times", "bold");
      doc.text(item.label, identityBoxX + 4, contentStartY + (i * rowHeight));
      doc.text(":", identityBoxX + 4 + labelColumnWidth, contentStartY + (i * rowHeight));
      doc.setFont("times", "normal");
      
      const maxWidth = identityBoxWidth - labelColumnWidth - colonWidth - 8;
      doc.text(item.value, identityBoxX + 4 + labelColumnWidth + colonWidth, contentStartY + (i * rowHeight), { maxWidth });
    });

    const contentEndY = boxStartY + boxHeight;

    // Table
    autoTable(doc, {
      startY: contentEndY + 10,
      head: [['SEMESTER', 'KODE MK', 'NAMA MATAKULIAH', 'SKS', 'DOSEN PENGAMPU']],
      body: activeCourses.map(c => [
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
        fontSize: 10,
        cellPadding: 4
      },
      bodyStyles: { 
        textColor: TEXT_DARK as any, 
        font: 'times', 
        fontSize: 9,
        cellPadding: 4,
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      styles: { 
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'left' },
        3: { halign: 'center', cellWidth: 10 },
        4: { halign: 'left', cellWidth: 45 },
      },
      margin: { left: 20, right: 20 }
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("times", "normal");
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Dokumen ini dicetak secara otomatis melalui Studelle System pada: ${dateStr} pukul ${timeStr}`, 105, 285, { align: "center" });

    doc.save(`Kurikulum_Smt_${activeSem}_${profile?.displayName?.replace(/\s+/g, '_')}.pdf`);
  };

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
      <div className="bg-studelle-emerald p-2 rounded-[2rem] border border-white/5 overflow-x-auto no-scrollbar shadow-2xl">
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
            <div className="w-14 h-14 bg-studelle-emerald text-white rounded-[1.25rem] flex items-center justify-center shadow-2xl">
               <Plus size={28} />
            </div>
            <div>
               <h3 className="text-3xl font-serif font-bold text-studelle-emerald leading-none">{editingId ? 'Edit Matakuliah' : 'Tambah Matakuliah'}</h3>
               <p className="text-sm font-medium tracking-wide text-studelle-emerald/40 mt-1.5">{editingId ? 'Perbarui Rincian Struktur Akademik' : 'Input Rincian Struktur Akademik Baru'}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-emerald/60 ml-2">Kategori</label>
               <select 
                 value={formData.category}
                 onChange={(e) => setFormData({...formData, category: e.target.value})}
                 className="studelle-input appearance-none cursor-pointer bg-studelle-cream border-studelle-emerald/5"
               >
                 <option value="Non BPro">Non BPro</option>
                 <option value="BPro">BPro</option>
                 {activeSem === 7 && <option value="TAP (Tugas Akhir Program)">TAP (Tugas Akhir Program)</option>}
               </select>
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-emerald/60 ml-2">Kode Matakuliah</label>
               <input 
                 type="text" 
                 value={formData.code}
                 onChange={(e) => setFormData({...formData, code: e.target.value})}
                 placeholder="Contoh: MK001" 
                 className="studelle-input bg-studelle-cream border-studelle-emerald/5"
               />
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-emerald/60 ml-2">Nama Matakuliah</label>
               <input 
                 type="text" 
                 value={formData.name}
                 onChange={(e) => setFormData({...formData, name: e.target.value})}
                 placeholder="Contoh: Matematika Murni" 
                 className="studelle-input bg-studelle-cream border-studelle-emerald/5"
               />
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-emerald/60 ml-2">Bobot SKS</label>
               <input 
                 type="number" 
                 value={formData.sks || ''}
                 onChange={(e) => {
                   const val = e.target.value;
                   const parsed = parseInt(val, 10);
                   setFormData({...formData, sks: isNaN(parsed) ? 0 : parsed});
                 }}
                 className="studelle-input bg-studelle-cream border-studelle-emerald/5"
               />
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-emerald/60 ml-2">Jenis Matakuliah</label>
               <select 
                 value={formData.type}
                 onChange={(e) => setFormData({...formData, type: e.target.value})}
                 className="studelle-input appearance-none cursor-pointer bg-studelle-cream border-studelle-emerald/20"
               >
                 <option value="Wajib">Wajib</option>
                 <option value="Pilihan">Pilihan</option>
               </select>
            </div>
            <div className="space-y-3">
               <label className="text-xs font-bold tracking-wide text-studelle-emerald/60 ml-2">Dosen Pengampu</label>
               <input 
                 type="text" 
                 value={formData.lecturer}
                 onChange={(e) => setFormData({...formData, lecturer: e.target.value})}
                 placeholder="Nama lengkap dosen" 
                 className="studelle-input bg-studelle-cream border-studelle-emerald/5"
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
              className="text-xs font-bold text-studelle-emerald/40 hover:text-studelle-emerald uppercase tracking-widest"
            >
              Batal Edit
            </button>
         )}
      </div>

      {/* List Card */}
      <div className="studelle-card shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
         <div className="p-10 bg-studelle-emerald/[0.02] border-b border-studelle-emerald/5 flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-studelle-emerald/5 rounded-[1.25rem] flex items-center justify-center text-studelle-emerald shadow-inner">
                  <BookMarked size={28} />
               </div>
               <div>
                  <h3 className="text-3xl font-serif font-bold text-studelle-emerald leading-none">Semester {activeSem}</h3>
                  <p className="text-sm font-medium tracking-wide text-studelle-emerald/40 mt-1.5">Daftar Struktur Akademik Resmi</p>
               </div>
            </div>
            <div className="bg-studelle-emerald text-white px-8 py-3 rounded-2xl text-xs font-bold tracking-widest shadow-xl flex items-center gap-4">
               <span>{activeCourses.length} Matakuliah Terdaftar</span>
               <div className="w-px h-4 bg-white/20" />
               <button onClick={handleDownloadPDF} className="hover:text-studelle-gold transition-colors uppercase text-[10px]">Cetak</button>
            </div>
         </div>

         <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-studelle-emerald/10">
            <table className="w-full min-w-[800px] md:min-w-0 text-left">
               <thead>
                  <tr className="border-b border-studelle-emerald/5 text-studelle-emerald/40 text-xs font-bold tracking-widest bg-studelle-emerald/[0.01]">
                     <th className="px-12 py-8">KODE</th>
                     <th className="px-12 py-8">NAMA MATKUL</th>
                     <th className="px-12 py-8 text-center">SKS</th>
                     <th className="px-12 py-8 text-center uppercase">Jenis</th>
                     <th className="px-12 py-8">DOSEN</th>
                     <th className="px-12 py-8 text-right">AKSI</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-studelle-emerald/5">
                  {loading ? (
                    <tr>
                       <td colSpan={6} className="px-12 py-40 text-center">
                          <Loader2 size={48} className="animate-spin text-studelle-emerald/20 mx-auto" />
                       </td>
                    </tr>
                  ) : activeCourses.length > 0 ? (
                    activeCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-studelle-emerald/[0.03] transition-colors group">
                         <td className="px-12 py-10">
                            <p className="text-sm font-mono font-bold text-studelle-accent tracking-tighter">{course.code}</p>
                            <p className="text-[10px] font-medium text-studelle-emerald/40 mt-1">{course.category}</p>
                         </td>
                         <td className="px-12 py-10">
                            <p className="text-lg font-serif font-bold text-studelle-emerald tracking-tight italic">{course.name}</p>
                          </td>
                          <td className="px-12 py-10 text-center">
                             <div className="inline-flex flex-col items-center">
                                <p className="text-3xl font-serif font-bold text-studelle-emerald leading-none">{course.sks}</p>
                                <span className="text-[10px] font-bold text-studelle-emerald/30 mt-1">SKS</span>
                             </div>
                          </td>
                         <td className="px-12 py-10 text-center">
                            <span className={cn(
                               "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                               course.type === 'Wajib' ? "bg-studelle-emerald/5 text-studelle-emerald/60" : "bg-studelle-gold/10 text-studelle-gold"
                            )}>
                               {course.type || 'Wajib'}
                            </span>
                         </td>
                         <td className="px-12 py-10">
                            <p className="text-sm font-serif font-medium text-studelle-emerald/60">{course.lecturer || '-'}</p>
                         </td>
                         <td className="px-12 py-10 text-right">
                            <div className="flex justify-end gap-3 transition-all duration-300">
                               <button 
                                 onClick={() => handleEdit(course)}
                                 title="Edit Matakuliah"
                                 className="w-12 h-12 rounded-2xl bg-studelle-emerald/5 flex items-center justify-center text-studelle-emerald/40 hover:text-studelle-gold hover:bg-white transition-all shadow-sm border border-transparent hover:border-studelle-gold/20"
                               >
                                  <Edit3 size={18} />
                               </button>
                               <button 
                                 onClick={() => {
                                   handleDelete(course.id);
                                 }}
                                 title="Hapus Matakuliah"
                                 className="w-12 h-12 rounded-2xl bg-studelle-emerald/5 flex items-center justify-center text-studelle-emerald/40 hover:text-red-500 hover:bg-white transition-all shadow-sm border border-transparent hover:border-red-100"
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
                          <div className="w-24 h-24 bg-studelle-emerald/5 rounded-[3rem] mx-auto flex items-center justify-center text-studelle-emerald/20 shadow-inner">
                             <GraduationCap size={48} />
                          </div>
                          <p className="text-xl font-serif font-medium text-studelle-emerald/40">Belum ada matakuliah yang terdaftar di semester ini.</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>

         {activeCourses.length > 0 && (
            <div className="p-10 bg-studelle-emerald/[0.03] border-t border-studelle-emerald/5 flex justify-center">
               <div className="flex items-center gap-5 bg-white/80 backdrop-blur-md px-10 py-4 rounded-[2rem] border border-studelle-emerald/10 shadow-2xl">
                  <p className="text-xs font-bold tracking-widest text-studelle-emerald/40">Akumulasi Bobot</p>
                  <div className="w-px h-6 bg-studelle-emerald/10" />
                  <p className="text-4xl font-serif font-bold text-studelle-emerald">{totalSks}<span className="text-sm ml-2 opacity-40">SKS</span></p>
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
