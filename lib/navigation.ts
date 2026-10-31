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

export const ADMIN_MENU: { label: string; items: MenuItem[] }[] = [
  {
    label: "Manajemen",
    items: [
      { icon: "👥", label: "Karyawan", href: "/admin/employees" },
      { icon: "📊", label: "Asesmen", href: "/admin/assessments" },
      { icon: "🏠", label: "Dasbor", href: "/admin/dashboard", isComingSoon: true },
      { icon: "⏰", label: "Presensi", href: "/admin/attendance", isComingSoon: true },
      { icon: "📅", label: "Pengajuan Cuti", href: "/admin/leave-requests" },
      { icon: "🗓️", label: "Kuota Cuti", href: "/admin/leave-quotas" },
      { icon: "🎌", label: "Hari Libur", href: "/admin/holidays" },
      { icon: "💰", label: "Payroll", href: "/admin/payroll", isComingSoon: true },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { icon: "📈", label: "Laporan", href: "/admin/reports", isComingSoon: true },
      { icon: "⚙️", label: "Pengaturan", href: "/admin/settings", isComingSoon: true },
    ],
  },
];
