"use client";

import { useState, ReactNode } from "react";
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
  menuSections
}: DashboardLayoutProps) {
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
          {children}
        </main>
      </div>

      {!hideBottomNav && !sidebarLocked && <BottomNav items={navItems} />}
    </div>
  );
}
