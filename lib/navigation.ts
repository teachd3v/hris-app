import { MenuItem } from "@/components/common/Sidebar";

export const EMPLOYEE_MENU: { label: string; items: MenuItem[] }[] = [
  {
    label: "Utama",
    items: [
      { icon: "🏠", label: "Beranda", href: "/employee/dashboard" },
      { icon: "👤", label: "Profil Saya", href: "/employee/profile" },
      { icon: "⏰", label: "Presensi", href: "/employee/attendance" },
      { icon: "📅", label: "Cuti", href: "/employee/cuti" },
      { icon: "📄", label: "Dokumen", href: "/employee/documents" },
      { icon: "📋", label: "Asesmen", href: "/employee/assessments" },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { icon: "💰", label: "Payroll", href: "/employee/coming-soon?feature=payroll", isComingSoon: true },
      { icon: "⚙️", label: "Pengaturan", href: "/employee/coming-soon?feature=settings", isComingSoon: true },
    ],
  },
];
