"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/common/DashboardLayout";

const EMPLOYEE_MENU = [
  {
    label: "Utama",
    items: [
      { icon: "👤", label: "Profil Saya", href: "/employee/profile" },
      { icon: "📄", label: "Dokumen", href: "/employee/documents", isComingSoon: true },
      { icon: "📋", label: "Asesmen", href: "/employee/assessments", isComingSoon: true },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { icon: "🏠", label: "Beranda", href: "/employee/dashboard" },
      { icon: "⏰", label: "Presensi", href: "/employee/attendance" },
      { icon: "📅", label: "Cuti", href: "/employee/cuti", isComingSoon: true },
      { icon: "💰", label: "Payroll", href: "/employee/payroll", isComingSoon: true },
      { icon: "⚙️", label: "Pengaturan", href: "/employee/settings", isComingSoon: true },
    ],
  },
];

const APPS = [
  { icon: "💰", label: "Payroll", desc: "Slip Gaji", href: "/employee/payroll", color: "bg-purple-50 text-purple-600", isComingSoon: true },
  { icon: "📄", label: "Dokumen", desc: "File Resmi", href: "/employee/documents", color: "bg-rose-50 text-rose-600", isComingSoon: true },
  { icon: "📋", label: "Asesmen", desc: "Evaluasi", href: "/employee/assessments", color: "bg-indigo-50 text-indigo-600", isComingSoon: true },
  { icon: "⚙️", label: "Settings", desc: "Pengaturan", href: "/employee/settings", color: "bg-gray-50 text-gray-600", isComingSoon: true },
];

import { getDistanceFromLatLonInKm } from "@/lib/geo";

const OFFICE_LAT = -6.4733643;
const OFFICE_LNG = 106.7274949;

export default function GridDashboardClient({
  userName,
  userInitials,
  userPhoto,
  userTitle,
  todayAttendance,
}: {
  userName: string;
  userInitials: string;
  userPhoto?: string;
  userTitle: string;
  todayAttendance?: { 
    clockIn?: string; 
    clockOut?: string;
    clockInLat?: number;
    clockInLng?: number;
    clockOutLat?: number;
    clockOutLng?: number;
  };
}) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // Format time helper to parse ISO string to 24-hour HH:mm format
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "--:--";
    
    try {
      // If it's a full ISO string like "2026-06-15T08:15:00.000Z"
      if (timeStr.includes("T")) {
        const d = new Date(timeStr);
        return d.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
      }
      
      // If it's something like "2026-06-15 08:15:00"
      if (timeStr.includes(" ")) {
        const timePart = timeStr.split(" ")[1];
        return timePart.substring(0, 5);
      }
      
      // If it's already "08:15:00"
      return timeStr.substring(0, 5);
    } catch (e) {
      return "--:--";
    }
  };

  // Helper to calculate and format distance
  const getDistanceText = (lat?: number, lng?: number) => {
    if (!lat || !lng) return "Lokasi tidak tersedia";
    const dist = getDistanceFromLatLonInKm(lat, lng, OFFICE_LAT, OFFICE_LNG);
    return `Radius ${(dist * 1000).toFixed(0)}m`;
  };

  return (
    <DashboardLayout
      role="Karyawan"
      userName={userName}
      userInitials={userInitials}
      userPhoto={userPhoto}
      menuSections={EMPLOYEE_MENU}
      hideTopbar
      noPadding
    >
      <div className="flex flex-col min-h-screen md:min-h-0 bg-[var(--bg)] md:bg-transparent pb-8">
        
        {/* Mobile Hero Header */}
        <div className="relative pt-5 pb-20 px-6 bg-[var(--red)] text-white rounded-b-[40px] md:hidden overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-[40px] -mr-20 -mt-20"></div>
          
          {/* Row 1: Dashboard Text (Left) & Actions (Right) */}
          <div className="relative z-10 flex justify-between items-center mb-6">
            <p className="text-white/90 text-[14px] font-bold tracking-widest uppercase">Dashboard</p>
            <div className="flex items-center gap-2.5">
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center relative shadow-sm border border-white/20">
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--yellow)] rounded-full"></span>
              </button>
              <button 
                onClick={async () => {
                  const { createClient } = await import("@/lib/supabase/client");
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shadow-sm border border-white/20 text-white/90"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          </div>

          {/* Row 2: Profile Info (Left) & Photo (Right) */}
          <div className="relative z-10 flex justify-between items-center mb-2">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-[22px] font-black tracking-tight truncate">{userName}</h1>
              <p className="text-white/90 text-[13px] font-medium mt-0.5 truncate">{userTitle}</p>
            </div>
            
            <Link href="/employee/profile" className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden font-bold shadow-lg shrink-0">
              {userPhoto ? <img src={userPhoto} alt="Profile" className="w-full h-full object-cover" /> : userInitials}
            </Link>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-8 px-5 pt-5">
           <div>
              <h1 className="text-3xl font-black text-[var(--ink)] tracking-tight">Dashboard Utama</h1>
              <p className="text-[var(--ink-3)] text-sm mt-1">Akses cepat ke semua fitur operasional HRIS.</p>
           </div>
        </div>

        <div className="relative z-20 px-6 md:px-0 -mt-12 md:mt-0 flex flex-col gap-5">
          
          {/* Attendance Summary Card */}
          <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-5 border border-[var(--line)]">
            <div className="flex items-center gap-2 mb-4 text-[var(--ink)]">
              <span className="text-lg">📅</span>
              <span className="font-bold text-[14px]">{mounted ? currentDate : "Memuat tanggal..."}</span>
            </div>
            
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1 bg-[var(--surface-item)] rounded-[16px] p-3 text-center border border-[var(--line)] flex flex-col items-center">
                <p className="text-[10px] text-[var(--ink-3)] font-bold uppercase tracking-wider mb-1">Clock In</p>
                <p className={`text-[20px] font-black ${todayAttendance?.clockIn ? "text-[var(--green)]" : "text-[var(--ink-4)]"}`}>
                  {formatTime(todayAttendance?.clockIn)}
                </p>
                {todayAttendance?.clockIn && (
                  <div className="mt-1.5 flex items-center gap-1 text-[8px] text-[var(--ink-3)] font-medium bg-white px-2 py-1 rounded-full shadow-sm border border-[var(--line)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--green)]"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span className="truncate max-w-[80px]">{getDistanceText(todayAttendance.clockInLat, todayAttendance.clockInLng)}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 bg-[var(--surface-item)] rounded-[16px] p-3 text-center border border-[var(--line)] flex flex-col items-center">
                <p className="text-[10px] text-[var(--ink-3)] font-bold uppercase tracking-wider mb-1">Clock Out</p>
                <p className={`text-[20px] font-black ${todayAttendance?.clockOut ? "text-[var(--blue)]" : "text-[var(--ink-4)]"}`}>
                  {formatTime(todayAttendance?.clockOut)}
                </p>
                {todayAttendance?.clockOut && (
                  <div className="mt-1.5 flex items-center gap-1 text-[8px] text-[var(--ink-3)] font-medium bg-white px-2 py-1 rounded-full shadow-sm border border-[var(--line)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--blue)]"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span className="truncate max-w-[80px]">{getDistanceText(todayAttendance.clockOutLat, todayAttendance.clockOutLng)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grid Menu Container */}
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5 border border-[var(--line)]">
            <div className="flex justify-between items-center mb-4 px-1">
               <h2 className="text-[15px] font-black text-[var(--ink)] tracking-tight">Menu Utama</h2>
               <span className="text-[9px] font-black tracking-wider text-[var(--red)] bg-[var(--red-soft)] px-2 py-0.5 rounded-md uppercase">TEACH</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {APPS.map((app, idx) => (
                <Link
                  key={idx}
                  href={app.isComingSoon ? "#" : app.href}
                  onClick={(e) => app.isComingSoon && e.preventDefault()}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-[16px] border border-[var(--line)] transition-all duration-300 ${
                    app.isComingSoon 
                      ? "opacity-60 bg-[var(--bg)] cursor-not-allowed" 
                      : "bg-white hover:border-[var(--red)] hover:shadow-[0_8px_20px_rgba(220,38,38,0.06)] cursor-pointer"
                  }`}
                >
                  {app.isComingSoon && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  )}
                  <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center text-[20px] mb-2 shadow-sm ${app.color}`}>
                    {app.icon}
                  </div>
                  <span className="font-bold text-[var(--ink)] text-[11px] text-center leading-tight">{app.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[20px] p-4 border border-blue-100/50 shadow-sm flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Bell size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-[13px] text-blue-900 mb-0.5">Pengumuman Admin</h3>
              <p className="text-[11px] text-blue-800/80 leading-relaxed">
                Townhall bulanan akan diadakan hari Jumat pukul 14:00 di ruang rapat utama. Wajib hadir bagi seluruh karyawan aktif.
              </p>
            </div>
          </div>

          {/* Colleague Attendance & Leave Quota grid */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Kehadiran Rekan Kerja */}
            <div className="bg-white rounded-[20px] p-4 border border-[var(--line)] shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[12px] text-[var(--ink)] mb-1">Kehadiran Tim</h3>
                <p className="text-[10px] text-[var(--ink-3)] mb-3">Hari ini</p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-700">A</div>
                <div className="w-7 h-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700">B</div>
                <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">+3</div>
              </div>
              <div className="mt-2 text-[10px] font-medium text-emerald-600">
                5 Rekan Hadir
              </div>
            </div>

            {/* Kuota Cuti */}
            <div className="bg-white rounded-[20px] p-4 border border-[var(--line)] shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[12px] text-[var(--ink)] mb-1">Sisa Cuti</h3>
                <p className="text-[10px] text-[var(--ink-3)] mb-3">Tahun 2026</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-black text-[var(--red)] leading-none">12</span>
                <span className="text-[11px] font-bold text-[var(--ink-3)]">Hari</span>
              </div>
              <div className="mt-1">
                <div className="w-full h-1.5 bg-[var(--surface-item)] rounded-full overflow-hidden">
                  <div className="w-[100%] h-full bg-[var(--red)] rounded-full"></div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
