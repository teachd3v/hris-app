"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import DashboardLayout from "@/components/common/DashboardLayout";
import type { MenuItem } from "@/components/common/Sidebar";

/**
 * Kerangka halaman dengan hero merah di HP (judul, tombol kembali) dan header biasa di desktop.
 * Dipakai Menu Admin (role Admin) dan Persetujuan Cuti atasan (role Karyawan).
 */
export default function MobileHeroShell({
  role,
  menuSections,
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel,
  userName,
  userPhoto,
  action,
  children,
}: {
  role: "Admin" | "Karyawan";
  menuSections: { label: string; items: MenuItem[] }[];
  eyebrow: string;
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  userName: string;
  userPhoto?: string;
  /** Tombol ikon di pojok kanan hero (HP), ukurannya sama dengan tombol kembali agar judul tetap simetris. */
  action?: ReactNode;
  children: ReactNode;
}) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  return (
    <DashboardLayout role={role} userName={userName} userInitials={initials} userPhoto={userPhoto} menuSections={menuSections} hideTopbar hideBottomNav noPadding>
      <div className="flex flex-col min-h-screen md:min-h-0 bg-[var(--bg)] md:bg-transparent pb-8">
        <div className="relative pt-5 pb-12 px-6 bg-[var(--red)] text-white rounded-b-[40px] md:hidden overflow-hidden shadow-md shrink-0">
          <Link href={backHref} aria-label={backLabel} className="absolute top-5 left-6 z-20 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full"><ChevronLeft size={20} strokeWidth={2.5} /></Link>
          {action && <div className="absolute top-5 right-6 z-20">{action}</div>}
          {/* Padding kiri-kanan sama dengan lebar tombol (40px + jarak) supaya judul tepat di tengah dan tidak menabrak tombol */}
          <h1 className="relative z-10 text-center text-white/90 text-[14px] font-bold tracking-widest uppercase mt-2 px-12 truncate">{title}</h1>
          {subtitle && <p className="relative z-10 text-center text-white/80 text-[11px] mt-1 px-12 truncate">{subtitle}</p>}
        </div>
        <div className="hidden md:block page-head px-5 pt-5">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="text-ink">{title}</h1>
          {subtitle && <p className="text-ink-3">{subtitle}</p>}
        </div>
        <div className="relative z-20 px-4 md:px-5 -mt-6 md:mt-0 flex flex-col gap-3 md:gap-4">{children}</div>
      </div>
    </DashboardLayout>
  );
}
