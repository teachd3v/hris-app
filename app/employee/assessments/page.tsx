"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Calendar,
  AlertCircle,
  ChevronRight,
  Info,
  CheckCircle2,
  ListTodo,
  Clock,
  Sparkles,
  Search,
  ArrowRight,
  Loader2
} from "lucide-react";
import DashboardLayout from "@/components/common/DashboardLayout";
import { createClient } from "@/lib/supabase/client";
import { getEmployeeAssessments, type EmployeeAssessment } from "./actions";

const EMPLOYEE_MENU = [
  {
    label: "Utama",
    items: [
      { icon: "👤", label: "Profil Saya", href: "/employee/dashboard" },
      { icon: "📄", label: "Dokumen", href: "/employee/documents" },
      { icon: "📋", label: "Asesmen", href: "/employee/assessments" },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { icon: "🏠", label: "Beranda", href: "/employee/beranda", isComingSoon: true },
      { icon: "⏰", label: "Presensi", href: "/employee/presensi", isComingSoon: true },
      { icon: "📅", label: "Cuti", href: "/employee/cuti", isComingSoon: true },
      { icon: "💰", label: "Payroll", href: "/employee/payroll", isComingSoon: true },
      { icon: "⚙️", label: "Pengaturan", href: "/employee/settings", isComingSoon: true },
    ],
  },
];

const TABS = [
  { key: "Semua", label: "Semua", icon: ListTodo },
  { key: "Belum Diisi", label: "Perlu Diisi", icon: Clock },
  { key: "Selesai", label: "Selesai", icon: CheckCircle2 },
];

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<EmployeeAssessment[]>([]);
  const [filter, setFilter] = useState<"Semua" | "Belum Diisi" | "Selesai">("Semua");
  const [userProfile, setUserProfile] = useState({ name: "User", initials: "U", photo: "" });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: emp } = await supabase.from('employees').select('name, photo_url').eq('id', user.id).single();
        if (emp) {
          setUserProfile({
            name: emp.name,
            initials: emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
            photo: emp.photo_url || ""
          });
        }
      }

      const data = await getEmployeeAssessments();
      setAssessments(data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAssessments = assessments.filter(a =>
    filter === "Semua" ? true : a.status === filter
  );

  const activeCount = assessments.filter(a => a.status === "Belum Diisi").length;

  return (
    <DashboardLayout
      role="Karyawan"
      userName={userProfile.name}
      userInitials={userProfile.initials}
      userPhoto={userProfile.photo}
      menuSections={EMPLOYEE_MENU}
    >
      <div className="page-head flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="eyebrow">Pusat Penilaian</span>
          <h1 className="text-ink">Asesmen Mandiri</h1>
          <p className="text-ink-3">Pantau dan lengkapi penilaian kompetensi serta motivasi Anda secara berkala.</p>
        </div>

        {activeCount > 0 && (
          <div id="tour-status" className="flex items-center gap-4 px-5 py-3 bg-[var(--red-soft)] border border-[var(--red)] rounded-2xl animate-in fade-in slide-in-from-right-4 duration-500 shadow-lg shadow-red-500/5">
            <div className="w-10 h-10 bg-[var(--red)] rounded-full flex items-center justify-center text-white shrink-0 shadow-md">
              <AlertCircle size={24} />
            </div>
            <div>
              <div className="text-[13px] font-black text-ink leading-tight">Perlu Perhatian</div>
              <div className="text-[11px] font-bold text-[var(--red)]">Ada {activeCount} asesmen tertunda.</div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Filter Tabs */}
      <div className="flex gap-2 p-1.5 bg-surface-item rounded-2xl border border-line-2 w-fit">
        {TABS.map((tab) => {
          const isActive = filter === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${isActive
                ? "bg-white text-[var(--red)] shadow-sm border border-line-2"
                : "text-ink-3 hover:text-ink"
                }`}
            >
              <Icon size={16} strokeWidth={isActive ? 3 : 2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center glass rounded-[32px] border-line-2">
            <Loader2 size={40} className="text-ink-3 animate-spin mb-4" />
            <p className="text-ink-3 font-medium">Memuat data asesmen...</p>
          </div>
        ) : filteredAssessments.length > 0 ? (
          filteredAssessments.map((item) => (
            <div key={item.id}>
              <AssessmentCard item={item} />
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center glass rounded-[32px] border-dashed border-2 border-line-2 animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 bg-line-2 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl grayscale opacity-50">
              📋
            </div>
            <h3 className="text-xl font-black text-ink">Tidak ada asesmen</h3>
            <p className="text-[13px] font-medium text-ink-3 mt-2 max-w-xs mx-auto">
              Semua kewajiban asesmen Anda sudah terpenuhi atau tidak ada data yang cocok dengan filter.
            </p>
          </div>
        )}
      </div>

      {/* Premium Info Card */}
      <div className="glass p-8 flex items-start gap-6 border-l-4 border-l-[var(--red)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
          <Sparkles size={120} />
        </div>
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-[var(--red)] shrink-0 shadow-inner">
          <Info size={28} />
        </div>
        <div>
          <h4 className="text-lg font-black text-ink mb-1 tracking-tight">Catatan untuk Karyawan</h4>
          <p className="text-[14px] font-medium text-ink-3 leading-relaxed max-w-3xl">
            Asesmen ini bersifat rahasia dan bertujuan untuk pemetaan potensi serta motivasi kerja Anda.
            Hasil analisis (seperti Grafik Radar) hanya dapat diakses oleh Admin/HR untuk keperluan manajemen talenta strategis.
          </p>
          <div className="flex gap-4 mt-4">
            <span className="flex items-center gap-1.5 text-[11px] font-black text-ink-3 bg-white/50 px-3 py-1 rounded-full border border-line-2">
              <Sparkles size={12} /> Data Terenkripsi
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-black text-ink-3 bg-white/50 px-3 py-1 rounded-full border border-line-2">
              <ClipboardCheck size={12} /> Tinjauan Berkala
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AssessmentCard({ item }: { item: EmployeeAssessment }) {
  const isDeadlineSoon = item.deadline && new Date(item.deadline) < new Date(new Date().setDate(new Date().getDate() + 3)) && item.status === "Belum Diisi";

  return (
    <div className="glass group flex flex-col p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden border-white/40">
      <div className="flex justify-between items-start mb-6">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white bg-ink px-3 py-1 rounded-md">
          {item.category}
        </span>
        <StatusBadge status={item.status} />
      </div>

      <h3 className="text-xl font-black text-ink mb-3 group-hover:text-[var(--red)] transition-colors leading-tight min-h-[3.5rem]">
        {item.title}
      </h3>

      <p className="text-[13px] font-medium text-ink-3 line-clamp-3 mb-8 flex-1 leading-relaxed">
        {item.description}
      </p>

      <div className="mt-auto space-y-4 pt-4 border-t border-line-2">
        <div className="flex items-center justify-between text-[11px] font-black">
          <div className="flex items-center gap-2 text-ink-3">
            <Calendar size={14} className="text-ink-4" />
            <span>Deadline: {item.deadline ? new Date(item.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tidak ada'}</span>
          </div>
          {isDeadlineSoon && (
            <span className="text-[var(--red)] flex items-center gap-1 animate-pulse">
              <Clock size={12} /> Segera!
            </span>
          )}
        </div>

        {item.status === "Belum Diisi" ? (
          <Link
            href={`/employee/assessments/${item.id}`}
            className="w-full py-4 bg-ink text-white rounded-2xl font-black text-[14px] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-ink/10 group-hover:scale-[1.02] active:scale-95"
          >
            Mulai Kuesioner
            <ArrowRight size={18} strokeWidth={3} />
          </Link>
        ) : item.status === "Selesai" ? (
          <Link
            href={`/employee/assessments/${item.id}`}
            className="w-full py-4 bg-white border-2 border-line-2 text-ink-2 rounded-2xl font-black text-[14px] flex items-center justify-center gap-2 hover:bg-line-2 hover:text-ink transition-all group-hover:scale-[1.02] active:scale-95"
          >
            <CheckCircle2 size={18} className="text-green-500" />
            Lihat Hasil
          </Link>
        ) : (
          <div className="w-full py-4 bg-line-2 text-ink-3 rounded-2xl font-black text-[14px] flex items-center justify-center gap-2 cursor-not-allowed opacity-70">
            <AlertCircle size={18} />
            Terlewat
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: EmployeeAssessment["status"] }) {
  const styles = {
    "Belum Diisi": "bg-red-50 text-[var(--red)] border-red-100",
    "Selesai": "bg-green-50 text-green-600 border-green-100",
    "Terlewat": "bg-gray-50 text-gray-400 border-gray-100",
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
}
