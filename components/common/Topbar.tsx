"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeftRight } from "lucide-react";
import GlobalSearch from "./GlobalSearch";

import { createClient } from "@/lib/supabase/client";

export default function Topbar({ 
  role = "Karyawan", 
  userName = "User", 
  initials = "U",
  photoUrl
}: { 
  role?: string; 
  userName?: string; 
  initials?: string;
  photoUrl?: string;
}) {
  const [actualRole, setActualRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('employees')
          .select('role')
          .eq('id', user.id)
          .single();
        
        const ADMIN_EMAILS = ['teachgen2025@gmail.com', 'teach.d3v@gmail.com'];
        const isAdmin = data?.role === 'Admin' || ADMIN_EMAILS.includes(user.email ?? '');
        
        console.log("Topbar Auth Check:", { 
          email: user.email, 
          dbRole: data?.role, 
          isAdmin,
          currentPageRole: role 
        });
        
        if (isAdmin) {
          setActualRole('Admin');
        } else {
          setActualRole(data?.role || 'Employee');
        }
      }
    };
    fetchRole();
  }, [role]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSwitchMode = () => {
    const targetPath = role === 'Admin' ? '/employee/dashboard' : '/admin/employees';
    console.log("Switching mode to:", targetPath);
    // Use window.location.href for a hard refresh to ensure middleware and roles are re-evaluated cleanly
    window.location.href = targetPath;
  };

  return (
    <div className="topbar glass">
      <div className="topbar-left">
        <GlobalSearch />
      </div>

      <div className="topbar-right">
        {/* Switch Mode Button for Admins */}
        {actualRole === 'Admin' && (
          <button
            onClick={handleSwitchMode}
            className="btn btn-ghost btn-sm mr-2 !rounded-xl border-line-2 hover:bg-white/10"
            title={role === 'Admin' ? 'Beralih ke Mode Karyawan' : 'Beralih ke Mode Admin'}
          >
            <ArrowLeftRight size={14} strokeWidth={2.5} className="text-ink-3" />
            <span className="hidden md:inline">
              {role === 'Admin' ? 'Mode Karyawan' : 'Mode Admin'}
            </span>
          </button>
        )}

        <div id="tour-profile" className="topbar-profile">
          <div className="topbar-avatar overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="topbar-profile-text">
            <div className="topbar-profile-label">{role}</div>
            <div className="topbar-profile-name">{userName}</div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="topbar-action text-red-500 hover:bg-red-50"
          title="Keluar"
        >
          <LogOut size={18} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
