"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import DashboardLayout from "@/components/common/DashboardLayout";
import { ADMIN_MENU } from "@/lib/navigation";

/** Kerangka halaman admin versi HP (hero merah + konten). Di desktop tetap tampil memakai sidebar admin. */
export default function MobileAdminShell({
  title,
  subtitle,
  backHref,
  backLabel,
  userName,
  userPhoto,
  children,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  userName: string;
  userPhoto?: string;
  children: ReactNode;
}) {
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  return (
    <DashboardLayout role="Admin" userName={userName} userInitials={initials} userPhoto={userPhoto} menuSections={ADMIN_MENU} hideTopbar hideBottomNav noPadding>
      <div className="flex flex-col min-h-screen md:min-h-0 bg-[var(--bg)] md:bg-transparent pb-8">
        <div className="relative pt-5 pb-12 px-6 bg-[var(--red)] text-white rounded-b-[40px] md:hidden overflow-hidden shadow-md shrink-0">
          <Link href={backHref} aria-label={backLabel} className="absolute top-5 left-6 z-20 w-10 h-10 flex items-center justify-center bg-white/10 rounded-full"><ChevronLeft size={20} strokeWidth={2.5} /></Link>
          <h1 className="relative z-10 text-center text-white/90 text-[14px] font-bold tracking-widest uppercase mt-2">{title}</h1>
          {subtitle && <p className="relative z-10 text-center text-white/80 text-[11px] mt-1">{subtitle}</p>}
        </div>
        <div className="hidden md:block page-head px-5 pt-5">
          <span className="eyebrow">Admin</span>
          <h1 className="text-ink">{title}</h1>
          {subtitle && <p className="text-ink-3">{subtitle}</p>}
        </div>
        <div className="relative z-20 px-4 md:px-5 -mt-6 md:mt-0 flex flex-col gap-3 md:gap-4">{children}</div>
      </div>
    </DashboardLayout>
  );
}
