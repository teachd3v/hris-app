import { MenuItem } from "@/components/common/Sidebar";

export const EMPLOYEE_MENU: { label: string; items: MenuItem[] }[] = [
  {
    label: "Utama",
    items: [
      { icon: "🏠", label: "Beranda", href: "/employee/dashboard" },
      { icon: "👤", label: "Profil Saya", href: "/employee/profile" },
      { icon: "⏰", label: "Presensi", href: "/employee/attendance" },
      { icon: "🕘", label: "Riwayat Presensi", href: "/employee/attendance/history" },
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

/** Tambahkan menu khusus super admin ("Log Audit") ke menu admin. */
export function withSuperAdminMenu(menu: { label: string; items: MenuItem[] }[]) {
  return menu.map((section) =>
    section.label === "Lainnya" && !section.items.some((i) => i.href === "/admin/audit")
      ? { ...section, items: [{ icon: "🧾", label: "Log Audit", href: "/admin/audit" }, ...section.items] }
      : section,
  );
}

/** Tambahkan menu "Tim Saya" (khusus yang punya bawahan) setelah "Cuti". */
export function withTeamMenu(menu: { label: string; items: MenuItem[] }[]) {
  return menu.map((section) => {
    if (section.items.some((i) => i.href === "/employee/tim")) return section;
    const idx = section.items.findIndex((i) => i.href === "/employee/cuti");
    if (idx < 0) return section;
    const items = [...section.items];
    items.splice(idx + 1, 0, { icon: "👥", label: "Tim Saya", href: "/employee/tim" });
    return { ...section, items };
  });
}
