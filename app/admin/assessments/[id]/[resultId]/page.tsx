"use client";

import { createClient } from "@/lib/supabase/client";
import { getAssessmentResult } from "../../actions";
import { useEffect, useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
import DashboardLayout from "@/components/common/DashboardLayout";
import Link from "next/link";
import AssessmentCharts from "@/components/admin/AssessmentCharts";
import AssessmentReportTemplate from "@/components/admin/AssessmentReportTemplate";
import { calculateSDTScores, getSDTProfile, getScoreGradation } from "@/lib/assessment-utils";
import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";

const ADMIN_MENU = [
  {
    label: "Manajemen",
    items: [
      { icon: "👥", label: "Karyawan", href: "/admin/employees" },
      { icon: "📊", label: "Asesmen", href: "/admin/assessments" },
      { icon: "🏠", label: "Dasbor", href: "/admin/dashboard", isComingSoon: true },
      { icon: "⏰", label: "Presensi", href: "/admin/attendance", isComingSoon: true },
      { icon: "📅", label: "Pengajuan Cuti", href: "/admin/leave-requests", isComingSoon: true },
      { icon: "💰", label: "Payroll", href: "/admin/payroll", isComingSoon: true },
    ]
  },
  {
    label: "Lainnya",
    items: [
      { icon: "📈", label: "Laporan", href: "/admin/reports", isComingSoon: true },
      { icon: "⚙️", label: "Pengaturan", href: "/admin/settings", isComingSoon: true },
    ]
  }
];

export default function IndividualAssessmentPage({ params }: { params: Promise<{ id: string, resultId: string }> }) {
  const { id, resultId } = use(params);
  const [template, setTemplate] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const router = useRouter();

  const handleDownloadPDF = async () => {
    const element = document.getElementById("pdf-report-template");
    if (!element) return;

    try {
      setIsGeneratingPDF(true);
      
      // Tunggu sampai semua font (Plus Jakarta Sans) siap di browser
      await document.fonts.ready;
      
      // Berikan waktu sejenak agar chart Recharts benar-benar stabil
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Gunakan toJpeg untuk menghindari artifact "semut pelangi" di Chrome
      const dataUrl = await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2.5, // Sedikit diturunkan agar lebih stabil di Chrome
        backgroundColor: "#ffffff",
        cacheBust: true,
        skipFonts: false,
        style: {
          position: 'relative',
          left: '0',
          display: 'block',
          transform: 'none'
        }
      });

      // Default A4 width in mm
      const pdfWidth = 210;
      
      // Create a temporary image to get dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const imgWidth = img.width;
      const imgHeight = img.height;
      
      // Calculate height in mm to match the A4 width (210mm)
      const ratio = pdfWidth / imgWidth;
      const dynamicHeightMm = imgHeight * ratio;

      // Create PDF with dynamic height (Single long page)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, dynamicHeightMm],
        compress: true
      });

      pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, dynamicHeightMm, undefined, 'FAST');
      pdf.save(`Report_Asesmen_${assessment.employees.name.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Gagal menghasilkan PDF. Silakan coba lagi.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/");

      const [pRes, resultData] = await Promise.all([
        supabase.from('employees').select('name, photo_url').eq('id', user.id).maybeSingle(),
        getAssessmentResult(id, resultId),
      ]);

      const { template, assessment, profileData } = resultData;
      if (profileData) setProfileData(profileData);
      setTemplate(template);
      setAssessment(assessment);
      setAdminProfile(pRes.data);
      setLoading(false);
    }
    fetchData();
  }, [id, resultId, router]);

  if (loading) return <div className="p-20 text-center font-bold text-ink-3 animate-pulse text-sm uppercase tracking-widest">Memuat Analisis Mendalam...</div>;
  if (!assessment) notFound();

  const adminName = adminProfile?.name || "Admin";
  const adminInitials = adminName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  const scores = calculateSDTScores(assessment.answers);
  const persona = getSDTProfile(scores);

  const colorMap: Record<string, { bg: string, border: string, text: string, accent: string }> = {
    red: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', accent: 'bg-red-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', accent: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', accent: 'bg-blue-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', accent: 'bg-orange-500' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-500', text: 'text-slate-700', accent: 'bg-slate-500' },
  };

  const colors = colorMap[persona.color] || colorMap.slate;

  return (
    <DashboardLayout
      role="Admin"
      userName={adminName}
      userInitials={adminInitials}
      userPhoto={adminProfile?.photo_url}
      menuSections={ADMIN_MENU}
    >
      <div className="flex flex-col gap-8 pb-20">
        {/* Navigation / Breadcrumbs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-3">
            <Link href="/admin/assessments" className="hover:text-hris-red">Manajemen Asesmen</Link>
            <span>/</span>
            <Link href={`/admin/assessments/${id}`} className="hover:text-hris-red">{template?.title}</Link>
            <span>/</span>
            <span className="text-ink">Analisis Individu</span>
          </div>
          <button onClick={() => router.back()} className="text-xs font-black text-ink-3 hover:text-ink uppercase tracking-widest flex items-center gap-2 transition-all">
            ← Kembali ke Daftar
          </button>
        </div>

        {/* Hero Header Profil */}
        <div className="glass p-10 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 select-none pointer-events-none">
            <span className="text-9xl font-black italic">{assessment.employees.employee_code}</span>
          </div>
          
          <div className="relative shrink-0 scale-110">
            {assessment.employees.photo_url ? (
              <img src={assessment.employees.photo_url} alt="" className="w-40 h-40 rounded-[40px] object-cover shadow-2xl border-4 border-white" />
            ) : (
              <div className="w-40 h-40 rounded-[40px] bg-gradient-to-br from-hris-yellow to-hris-red flex items-center justify-center text-white text-6xl font-black shadow-2xl border-4 border-white">
                {assessment.employees.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left pt-4 z-10">
            <div className="text-xs font-bold text-hris-red tracking-[0.2em] uppercase mb-2">Detailed Analysis Profile</div>
            <h1 className="text-4xl font-black text-ink mb-2">{assessment.employees.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-base font-semibold text-ink-2">
              <span>💼 {assessment.employees.title}</span>
              <span>🏢 {assessment.employees.dept}</span>
              <span>📧 {assessment.employees.email}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 md:pt-4 z-10">
            <button 
              className={`btn btn-primary ${isGeneratingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? '⏳ Memproses PDF...' : 'Unduh Report PDF'}
            </button>
            <button className="btn btn-ghost" onClick={() => router.push(`/admin/employees/${assessment.employees.id}`)}>Profil Administrasi</button>
          </div>
        </div>

        {/* Main Analysis Section */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Radar Chart (Large) */}
          <div className="xl:col-span-7 flex flex-col gap-4">
             <div className="flex items-center gap-3 px-2">
               <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
               <h2 className="text-lg font-black text-ink uppercase tracking-wider">Visualisasi Peta Motivasi</h2>
             </div>
             <div className="glass p-10 rounded-[48px] shadow-sm flex justify-center">
                <AssessmentCharts assessments={[assessment]} />
             </div>
          </div>

          {/* Persona & Details */}
          <div className="xl:col-span-5 flex flex-col gap-6">
             {/* Persona Card */}
             <div className={`p-8 rounded-[40px] border-l-[12px] ${colors.bg} ${colors.border} flex flex-col gap-6 shadow-sm`}>
                <div className="flex items-center gap-4">
                   <span className="text-5xl">{persona.icon}</span>
                   <div>
                     <div className="text-xs font-black text-ink-3 uppercase tracking-widest mb-1">Motivation Persona</div>
                     <div className={`text-2xl font-black ${colors.text} leading-none`}>{persona.label}</div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1">
                     <div className="text-xs font-black text-ink-4 uppercase tracking-tighter">Indikator Dominan</div>
                     <div className="text-sm font-bold text-ink leading-relaxed">{persona.indicators}</div>
                   </div>
                   <div className="space-y-1">
                     <div className="text-xs font-black text-ink-4 uppercase tracking-tighter">Analisis Psikologis</div>
                     <div className="text-sm font-medium text-ink-3 leading-relaxed italic">"{persona.explanation}"</div>
                   </div>
                   <div className="space-y-1">
                     <div className="text-xs font-black text-ink-4 uppercase tracking-tighter">Ciri-ciri di Lapangan</div>
                     <div className="text-sm font-medium text-ink-3 leading-relaxed">"{persona.traits}"</div>
                   </div>
                </div>

                <div className="pt-6 border-t border-black/5">
                   <div className="text-xs font-black text-hris-red uppercase mb-3 tracking-widest">💡 Strategi Treatment HR</div>
                   <div className="p-4 rounded-2xl bg-white text-sm font-bold text-ink leading-relaxed shadow-sm border border-black/[0.03]">
                     {persona.treatment}
                   </div>
                </div>
             </div>

             {/* Stats at Glance */}
             <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 rounded-3xl text-center">
                   <div className="text-[10px] font-black text-ink-3 uppercase mb-1">Status Selesai</div>
                   <div className="text-sm font-black text-green-600 uppercase tracking-tighter">SUCCESS SUBMITTED</div>
                </div>
                <div className="glass p-5 rounded-3xl text-center">
                   <div className="text-[10px] font-black text-ink-3 uppercase mb-1">Tanggal Submit</div>
                   <div className="text-sm font-black text-ink uppercase tracking-tighter">
                     {new Date(assessment.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Qualitative Responses (Full Width) */}
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3 px-2">
             <div className="w-1.5 h-6 bg-hris-red rounded-full"></div>
             <h2 className="text-lg font-black text-ink uppercase tracking-wider">Jawaban Esai & Refleksi Kualitatif</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4,5,6].map(i => {
                const q = template.schema.find((item: any) => item.id === `c${i}`);
                const ans = assessment.answers[`c${i}`];
                if (!q || !ans) return null;
                return (
                  <div key={i} className="glass p-6 rounded-[32px] flex flex-col gap-3 group hover:border-hris-red/20 transition-all">
                    <div className="text-[10px] font-black text-ink-4 uppercase tracking-widest group-hover:text-hris-red transition-colors">{q.question}</div>
                    <div className="text-sm font-medium text-ink leading-relaxed">{ans}</div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Hidden PDF Template Container */}
        <div 
          style={{ 
            position: 'fixed', 
            top: '-20000px', // Jauh di atas tapi tetap "rendered"
            left: 0,
            zIndex: -100,
            pointerEvents: 'none',
          }}
        >
          <AssessmentReportTemplate 
            employee={assessment.employees}
            template={template}
            assessment={assessment}
            scores={scores}
            persona={persona}
            profileData={profileData}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, color = "text-ink" }: { title: string; value: number | string; icon: string; color?: string }) {
  return (
    <div className="glass p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-2xl">{icon}</div>
      <div>
        <div className="text-[10px] font-black text-ink-3 uppercase tracking-widest">{title}</div>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
      </div>
    </div>
  );
}
