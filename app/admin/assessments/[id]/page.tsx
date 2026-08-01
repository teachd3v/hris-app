"use client";

import { getAssessmentAnalysis } from "../actions";
import { useEffect, useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import DashboardLayout from "@/components/common/DashboardLayout";
import Link from "next/link";
import AssessmentCharts from "@/components/admin/AssessmentCharts";
import * as XLSX from "xlsx";
import { calculateSDTScores, getSDTProfile } from "@/lib/assessment-utils";

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

export default function AssessmentAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [template, setTemplate] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const session = await getSession();
      if (!session?.user) return router.push("/");

      const analysisData = await getAssessmentAnalysis(id);
      
      const adminProf = { name: session.user.name || "Admin", photo_url: session.user.image || "" };

      const allEmployees = analysisData.employees;
      const existingAssessments = analysisData.assessments;

      const mergedAssessments = allEmployees.map(emp => {
        const existing = existingAssessments.find((a: any) => a.employees?.id === emp.id || a.employee_id === emp.id);
        if (existing) return existing;
        return {
          id: `virtual-${emp.id}`,
          employee_id: emp.id,
          template_id: id,
          status: 'Belum Diisi',
          employees: emp,
          answers: null,
          submitted_at: null,
          _isVirtual: true,
        };
      });

      setTemplate(analysisData.template);
      setAssessments(mergedAssessments);
      setAdminProfile(adminProf);
      setLoading(false);
    }
    fetchData();
  }, [id, router]);

  if (loading) return <div className="p-20 text-center font-bold text-ink-3 animate-pulse text-sm uppercase tracking-widest">Sinkronisasi Data Analisis...</div>;
  if (!template) notFound();

  const completed = assessments.filter(a => a.status === 'Selesai');
  const pending = assessments.filter(a => a.status === 'Belum Diisi');

  const adminName = adminProfile?.name || "Admin";
  const adminInitials = adminName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

  const profileStats = completed.reduce((acc: any, curr: any) => {
    if (curr.answers) {
      const scores = calculateSDTScores(curr.answers);
      const profile = getSDTProfile(scores);
      acc[profile.label] = (acc[profile.label] || 0) + 1;
    }
    return acc;
  }, {});

  const profiles = [
    { label: "Sang Visioner / Pendorong Misi", icon: "🔭", color: "emerald" },
    { label: "Profil Realistis / Berimbang", icon: "⚖️", color: "blue" },
    { label: "Sang Pragmatis / Pekerja Transaksional", icon: "🎯", color: "orange" },
    { label: "Profil Krisis / Rentan Burnout", icon: "🚨", color: "red" },
  ];

  const handleExport = () => {
    if (assessments.length === 0) return;

    // Menyiapkan data untuk Excel
    const data = assessments.map((a: any) => {
      let autonomous = "-";
      let controlled = "-";
      let profileLabel = "-";

      if (a.answers) {
        const scores = calculateSDTScores(a.answers);
        autonomous = scores.autonomous.toFixed(2);
        controlled = scores.controlled.toFixed(2);
        profileLabel = getSDTProfile(scores).label;
      }

      const row: any = {
        "NIK": a.employees?.employee_code || "",
        "Nama": a.employees?.name || "",
        "Departemen": a.employees?.dept || "",
        "Jabatan": a.employees?.title || "",
        "Status": a.status || "",
        "Profil SDT": profileLabel,
        "Skor Otonom": autonomous,
        "Skor Terkontrol": controlled,
        "Tanggal Submit": a.submitted_at 
          ? new Date(a.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
          : "-"
      };

      // Tambahkan jawaban untuk setiap pertanyaan di schema
      if (template.schema && Array.isArray(template.schema)) {
        template.schema.forEach((q: any) => {
          row[q.question] = a.answers?.[q.id] || "-";
        });
      }

      return row;
    });

    // Membuat Worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns (basic implementation)
    const objectMaxLength: number[] = [];
    data.forEach((row) => {
      Object.values(row).forEach((val, index) => {
        const len = val ? val.toString().length : 0;
        objectMaxLength[index] = Math.max(objectMaxLength[index] || 0, len);
      });
    });
    worksheet["!cols"] = objectMaxLength.map((w) => ({ width: w + 2 }));

    // Membuat Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Asesmen");
    
    // Download File
    const fileName = `Rekap_${template.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <DashboardLayout
      role="Admin"
      userName={adminName}
      userInitials={adminInitials}
      userPhoto={adminProfile?.photo_url}
      menuSections={ADMIN_MENU}
    >
      <div className="flex flex-col gap-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium text-ink-3">
          <Link href="/admin/assessments" className="hover:text-hris-red transition-colors">Manajemen Asesmen</Link>
          <span>/</span>
          <span className="text-ink">Analisis Detail</span>
        </div>

        {/* Header Section */}
        <div className="glass p-6 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
          <div className="flex-1 min-w-0">
            <div className="px-3 py-1 rounded-lg bg-black/5 text-[10px] font-black text-ink-3 uppercase tracking-widest w-fit mb-3">
              {template.category}
            </div>
            <h1 className="text-2xl font-black text-ink leading-tight mb-2">{template.title}</h1>
            <p className="text-sm text-ink-3 font-medium line-clamp-2">{template.description}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              className="btn btn-ghost btn-sm"
              onClick={handleExport}
            >
              📥 Unduh Rekap (.xlsx)
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Partisipan" value={assessments.length} icon="👥" />
          <StatCard title="Sudah Selesai" value={completed.length} icon="✅" color="text-green-600" />
          <StatCard title="Belum Mengisi" value={pending.length} icon="⏳" color="text-red-500" />
        </div>

        {/* Sebaran Profil */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h2 className="text-[10px] font-black text-ink-3 uppercase tracking-widest">Sebaran Profil Motivasi</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {profiles.map((p, idx) => {
              const count = profileStats[p.label] || 0;
              const percentage = completed.length > 0 ? Math.round((count / completed.length) * 100) : 0;
              
              const colorClasses: Record<string, string> = {
                emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
                blue: "bg-blue-50 text-blue-700 border-blue-100",
                orange: "bg-orange-50 text-orange-700 border-orange-100",
                red: "bg-red-50 text-red-700 border-red-100",
              };

              return (
                <div key={idx} className={`glass p-5 flex flex-col gap-3 border ${colorClasses[p.color] || "bg-white text-ink border-black/5"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-xs font-black opacity-40">{percentage}%</span>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-tighter leading-tight mb-1">{p.label}</div>
                    <div className="text-2xl font-black">{count} <span className="text-xs font-medium opacity-60">Org</span></div>
                  </div>
                  <div className="h-1 w-full bg-black/5 rounded-full overflow-hidden mt-1">
                    <div className={`h-full opacity-60 ${p.color === 'emerald' ? 'bg-emerald-500' : p.color === 'blue' ? 'bg-blue-500' : p.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Utama */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-hris-red"></div>
            <h2 className="text-[10px] font-black text-ink-3 uppercase tracking-widest">Rata-rata Organisasi</h2>
          </div>
          <AssessmentCharts assessments={assessments} />
        </div>

        {/* Participants Table */}
        <div className="glass p-6 flex flex-col gap-4">
          <h2 className="text-lg font-black text-ink uppercase tracking-wider">Daftar Partisipan</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5">
                  <th className="py-4 text-[10px] font-black text-ink-4 uppercase tracking-widest w-12">#</th>
                  <th className="py-4 text-[10px] font-black text-ink-4 uppercase tracking-widest">Karyawan</th>
                  <th className="py-4 text-[10px] font-black text-ink-4 uppercase tracking-widest">Profil SDT</th>
                  <th className="py-4 text-[10px] font-black text-ink-4 uppercase tracking-widest">Departemen</th>
                  <th className="py-4 text-[10px] font-black text-ink-4 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {assessments.map((a: any, i: number) => {
                  const isSelesai = a.status === 'Selesai';
                  const isVirtual = a._isVirtual === true;
                  const isClickable = isSelesai && !isVirtual;

                  let profileInfo = null;
                  if (isSelesai && a.answers) {
                    const s = calculateSDTScores(a.answers);
                    const p = getSDTProfile(s);
                    profileInfo = { scores: s, profile: p };
                  }

                  return (
                    <tr
                      key={a.id}
                      onClick={() => isClickable && router.push(`/admin/assessments/${id}/${a.id}`)}
                      className={`group transition-all ${isClickable ? 'cursor-pointer hover:bg-black/[0.02]' : 'opacity-40 grayscale pointer-events-none'}`}
                    >
                      <td className="py-4 text-xs font-bold text-ink-4">{i + 1}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center font-bold text-xs overflow-hidden">
                            {a.employees?.photo_url ? (
                              <img src={a.employees.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              a.employees?.name?.charAt(0) || '?'
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-ink truncate">{a.employees?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-ink-3 font-medium truncate">{a.employees?.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        {profileInfo ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="text-[10px] font-black text-ink uppercase tracking-tight">
                              <span className={profileInfo.scores.autonomous >= 5 ? "text-emerald-600" : ""}>Otonom: {profileInfo.scores.autonomous.toFixed(1)}</span>
                              <span className="mx-1 opacity-20">|</span>
                              <span className={profileInfo.scores.controlled >= 5 ? "text-orange-600" : ""}>Terkontrol: {profileInfo.scores.controlled.toFixed(1)}</span>
                            </div>
                            <div className="text-[11px] font-bold text-ink-3">
                              {profileInfo.profile.label}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-ink-4 italic">Belum ada data</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="text-xs font-bold text-ink-2">{a.employees?.dept || 'Umum'}</div>
                        <div className="text-[10px] text-ink-3 font-medium uppercase">{a.employees?.title || '-'}</div>
                      </td>
                      <td className="py-4 text-right">
                        <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                          isSelesai ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {a.status?.toUpperCase()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
