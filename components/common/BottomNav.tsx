"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuItem } from "./Sidebar";

export default function BottomNav({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/" || href === "/admin" || href === "/employee/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Find specific items for 3-button mobile layout
  const cutiItem = items.find(i => i.label.toLowerCase().includes("cuti")) || { label: "Cuti", icon: "🏖️", href: "/employee/cuti" };
  const presensiItem = items.find(i => i.label.toLowerCase().includes("presensi")) || { label: "Presensi", icon: "⏰", href: "/employee/attendance" };
  const profileItem = items.find(i => i.label.toLowerCase().includes("profil")) || { label: "Profil", icon: "👤", href: "/employee/profile" };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 pb-safe pointer-events-none">
      <div className="relative w-full max-w-md mx-auto pointer-events-auto h-[76px] mt-[30px]">
        {/* Custom SVG Background for curved floating effect */}
        <svg 
          viewBox="0 0 375 76" 
          className="absolute bottom-0 w-full h-[76px] drop-shadow-[0_-10px_20px_rgba(220,38,38,0.15)]"
          preserveAspectRatio="none"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 24C0 10.7452 10.7452 0 24 0H133.488C142.135 0 149.957 4.90809 154.214 12.3956L158.077 19.1895C163.69 29.0567 174.523 35.15 186.082 35.15C198.544 35.15 210.057 28.1633 215.656 17.2917L219.043 10.7135C223.361 2.32759 232.062 0 241.469 0H351C364.255 0 375 10.7452 375 24V76H0V24Z" fill="white"/>
        </svg>

        <div className="absolute inset-0 flex justify-between items-center px-10">
          
          {/* LEFT: Cuti */}
          <Link
            href={cutiItem.href}
            className="flex flex-col items-center justify-center gap-1 w-16 -mt-3 group"
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${isActive(cutiItem.href) ? 'bg-orange-100 shadow-inner scale-110' : 'bg-transparent hover:bg-gray-50'}`}>
              <span className={`text-[22px] transition-transform duration-300 ${isActive(cutiItem.href) ? 'scale-110 drop-shadow-md' : 'grayscale-[50%] opacity-70 group-hover:scale-110 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                {cutiItem.icon}
              </span>
            </div>
            <span className={`text-[10px] font-black tracking-wide transition-colors duration-300 ${isActive(cutiItem.href) ? 'text-[var(--red)]' : 'text-[#15141A]'}`}>
              {cutiItem.label}
            </span>
          </Link>

          {/* CENTER: Presensi (Floating Action Button) */}
          <Link
            href={presensiItem.href}
            className="absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center justify-center group"
          >
            <div className="flex flex-col items-center justify-center w-[64px] h-[64px] rounded-full bg-gradient-to-br from-[var(--red)] to-[#991B1B] text-white shadow-[0_8px_20px_rgba(220,38,38,0.4)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95 border-[4px] border-[var(--bg)] mb-1">
              <div className="text-3xl drop-shadow-md relative -top-[1px]">{presensiItem.icon}</div>
            </div>
            <span className="text-[10px] font-bold text-[var(--red)] tracking-wide">{presensiItem.label}</span>
          </Link>

          {/* RIGHT: Profil */}
          <Link
            href={profileItem.href}
            className={`flex flex-col items-center gap-0.5 transition-all duration-300 w-16 ${
              isActive(profileItem.href) ? "text-[var(--red)] font-black" : "text-[#15141A]"
            }`}
          >
            <div className={`text-2xl ${isActive(profileItem.href) ? "scale-110 drop-shadow-sm" : ""}`}>
              {profileItem.icon}
            </div>
            <span className="text-[10px] font-bold tracking-wide whitespace-nowrap">{profileItem.label}</span>
          </Link>

        </div>
      </div>
    </div>
  );
}
