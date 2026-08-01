"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export interface MenuItem {
  icon: string;
  label: string;
  href: string;
  isComingSoon?: boolean;
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  menuSections: {
    label: string;
    items: MenuItem[];
  }[];
  user: {
    name: string;
    role: string;
    initials: string;
    photoUrl?: string;
  };
}

export default function Sidebar({ collapsed, onToggle, menuSections, user }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const isActive = (href: string) => {
    if (href === "/" || href === "/admin" || href === "/employee/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Unified Collapse Button */}
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        title={collapsed ? "Buka" : "Tutup"}
      >
        {collapsed ? "›" : "‹"}
      </button>

      <Link href="/" className="sidebar-header">
        <div className="sidebar-logo" />
        <span className="font-bold">TEACH HRIS</span>
      </Link>

      <div className="flex flex-col gap-6 mt-4">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="sidebar-section">
            {!collapsed && <div className="sidebar-label">{section.label}</div>}
            {section.items.map((item, iIdx) => (
            <Link
                key={iIdx}
                href={item.isComingSoon ? "#" : item.href}
                className={`sidebar-item ${isActive(item.href) ? "active" : ""} ${item.isComingSoon ? "coming-soon" : ""}`}
                onClick={(e) => item.isComingSoon && e.preventDefault()}
                style={{
                  opacity: item.isComingSoon ? 0.5 : 1,
                  cursor: item.isComingSoon ? 'default' : 'pointer',
                  pointerEvents: item.isComingSoon ? 'none' : 'auto',
                  filter: item.isComingSoon ? 'grayscale(0.3)' : 'none',
                }}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span className="sidebar-item-label">
                  {item.label}
                  {item.isComingSoon && !collapsed && (
                    <span style={{
                      fontSize: '8px',
                      background: 'var(--ink-4)',
                      color: 'white',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      marginLeft: '8px',
                      verticalAlign: 'middle',
                      letterSpacing: '0.05em',
                      fontWeight: 800,
                    }}>SOON</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer mt-auto pt-4 border-t border-line">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="sidebar-user flex-1 min-w-0">
              <div className="sidebar-user-avatar overflow-hidden">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.initials
                )}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name truncate">{user.name}</div>
                <div className="sidebar-user-role">{user.role}</div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              title="Keluar" 
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} strokeWidth={2.25} />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogout}
            title="Keluar" 
            className="w-10 h-10 flex items-center justify-center mx-auto rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
          >
            <LogOut size={18} strokeWidth={2.25} />
          </button>
        )}
      </div>
    </aside>
  );
}
