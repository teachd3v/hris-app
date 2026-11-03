"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSession } from "next-auth/react";
import { withSuperAdminMenu, withTeamMenu } from "@/lib/navigation";
import { getHasTeam } from "@/app/employee/tim/actions";
import Sidebar, { MenuItem } from "@/components/common/Sidebar";
import Topbar from "@/components/common/Topbar";
import BottomNav from "@/components/common/BottomNav";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "Admin" | "Karyawan";
  userName: string;
  userInitials: string;
  userPhoto?: string;
  hideTopbar?: boolean;
  hideBottomNav?: boolean;
  showMobileHome?: boolean;
  noPadding?: boolean;
  sidebarLocked?: boolean;
  menuSections: {
    label: string;
    items: MenuItem[];
  }[];
}

export default function DashboardLayout({
  children,
  role,
  userName,
  userInitials,
  userPhoto,
  hideTopbar = false,
  hideBottomNav = false,
  showMobileHome = false,
  noPadding = false,
  sidebarLocked = false,
  menuSections: baseMenuSections
}: DashboardLayoutProps) {
  // Halaman admin selain /admin/m (versi HP) dirancang untuk desktop: di layar sempit tampilkan pesan
  const pathname = usePathname();
  // Halaman karyawan Dokumen & Asesmen juga khusus desktop.
  const desktopOnly =
    (role === "Admin" && !pathname.startsWith("/admin/m")) ||
    (role === "Karyawan" &&
      (pathname.startsWith("/employee/documents") || pathname.startsWith("/employee/assessments")));

  // Menu khusus super admin (Log Audit): flag dihitung di server (session.user.isSuperAdmin)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  useEffect(() => {
    if (role !== "Admin") return;
    getSession().then((s) => setIsSuperAdmin(Boolean((s?.user as any)?.isSuperAdmin)));
  }, [role]);
  // Menu "Tim Saya" hanya untuk karyawan yang punya bawahan
  const [hasTeam, setHasTeam] = useState(false);
  useEffect(() => {
    if (role !== "Karyawan") return;
    getHasTeam().then(setHasTeam).catch(() => setHasTeam(false));
  }, [role]);
  let menuSections = isSuperAdmin ? withSuperAdminMenu(baseMenuSections) : baseMenuSections;
  if (hasTeam) menuSections = withTeamMenu(menuSections);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar_collapsed") === "true";
    }
    return false;
  });

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  // filter specific items to highlight on BottomNav
  const allItems = menuSections.flatMap(s => s.items);
  const bottomNavLabels = ["Cuti", "Presensi", "Profil Saya", "Dokumen", "Karyawan"];
  let navItems = allItems.filter(item => bottomNavLabels.includes(item.label)).slice(0, 5);
  if (navItems.length === 0) navItems = allItems.slice(0, 4);

  return (
    <div className={`flex flex-col min-h-screen bg-[var(--bg)] ${noPadding ? 'pb-24 md:pb-5' : 'gap-4 p-5 md:p-5 pb-24 md:pb-5'}`}>
      <div className={`${hideTopbar ? "hidden md:block" : "block"} ${noPadding ? "md:px-5 md:pt-5" : ""}`}>
        <Topbar role={role} userName={userName} initials={userInitials} photoUrl={userPhoto} showMobileHome={showMobileHome} />
      </div>
      
      <div className={`sidebar-layout ${noPadding ? 'p-0 md:p-5' : ''}`}>
        <div className="hidden md:block">
          <Sidebar 
            collapsed={sidebarLocked ? true : collapsed}
            onToggle={sidebarLocked ? () => {} : handleToggle} 
            menuSections={menuSections}
            locked={sidebarLocked}
            user={{ 
              name: userName, 
              role: role === "Admin" ? "Administrator" : "Employee", 
              initials: userInitials,
              photoUrl: userPhoto 
            }}
          />
        </div>
        
        <main className="flex-1 flex flex-col gap-5">
          {desktopOnly ? (
            <>
              <div className="hidden md:contents">{children}</div>
              <div className="md:hidden bg-white rounded-[24px] border border-[var(--line)] p-6 text-center flex flex-col items-center gap-3" data-testid="desktop-only-notice">
                <div className="text-4xl">🖥️</div>
                <h2 className="text-[16px] font-black text-ink">Halaman ini khusus desktop</h2>
                <p className="text-[12px] text-ink-3 leading-relaxed">Fitur ini membutuhkan layar lebih lebar. {role === "Admin" ? "Buka dari komputer, atau gunakan Menu Admin untuk aksi cepat dari HP." : "Silakan buka dari komputer."}</p>
                {role === "Admin" && <Link href="/admin/m" className="w-full h-12 rounded-full bg-[var(--red)] text-white font-bold text-[14px] flex items-center justify-center">Buka Menu Admin</Link>}
                <Link href="/employee/dashboard" className="text-[12px] font-bold text-ink-2 underline">Kembali ke beranda</Link>
              </div>
            </>
          ) : (
            children
          )}
        </main>
      </div>

      {!hideBottomNav && !sidebarLocked && <BottomNav items={navItems} />}
    </div>
  );
}
