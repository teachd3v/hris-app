"use client";

import { Suspense } from "react";
import DashboardLayout from "@/components/common/DashboardLayout";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const feature = searchParams.get("feature") || "Fitur";

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="glass p-12 text-center max-w-md flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-hris-yellow-soft flex items-center justify-center text-4xl shadow-inner">
          🚧
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Coming Soon!</h1>
          <p className="text-ink-3 mt-2">
            Menu <strong>{feature}</strong> saat ini masih dalam tahap perencanaan dan pengembangan oleh tim produk TEACH HRIS.
          </p>
        </div>
        <Link href="/employee/dashboard">
          <button className="btn btn-primary">
            Kembali ke Profil Saya
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <DashboardLayout
      role="Karyawan"
      userName="Andi Pratama"
      userInitials="AP"
      menuSections={EMPLOYEE_MENU}
    >
      <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[60vh] text-ink-3">Loading...</div>}>
        <ComingSoonContent />
      </Suspense>
    </DashboardLayout>
  );
}
