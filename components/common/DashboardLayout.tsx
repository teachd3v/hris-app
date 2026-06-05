"use client";

import { useState, ReactNode } from "react";
import Sidebar, { MenuItem } from "@/components/common/Sidebar";
import Topbar from "@/components/common/Topbar";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "Admin" | "Karyawan";
  userName: string;
  userInitials: string;
  userPhoto?: string;
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
  menuSections
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-5 min-h-screen bg-[var(--bg)]">
      <Topbar role={role} userName={userName} initials={userInitials} photoUrl={userPhoto} />
      
      <div className="sidebar-layout">
        <Sidebar 
          collapsed={collapsed} 
          onToggle={() => setCollapsed(!collapsed)} 
          menuSections={menuSections}
          user={{ 
            name: userName, 
            role: role === "Admin" ? "Administrator" : "Employee", 
            initials: userInitials,
            photoUrl: userPhoto 
          }}
        />
        
        <main className="flex-1 flex flex-col gap-5">
          {children}
        </main>
      </div>
    </div>
  );
}
