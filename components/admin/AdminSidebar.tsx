"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const MENU_ITEMS = [
  { icon: "👥", label: "Karyawan", href: "/admin/employees" },
  { icon: "📊", label: "Asesmen", href: "/admin/assessments" },
  { icon: "🏠", label: "Dasbor", href: "/admin/dashboard", isComingSoon: true },
  { icon: "⏰", label: "Presensi", href: "/admin/attendance", isComingSoon: true },
  { icon: "📅", label: "Pengajuan Cuti", href: "/admin/leave-requests", isComingSoon: true },
  { icon: "💰", label: "Payroll", href: "/admin/payroll", isComingSoon: true },
  { icon: "📈", label: "Laporan", href: "/admin/reports", isComingSoon: true },
];

const OTHER_ITEMS = [
  { icon: "⚙️", label: "Pengaturan", href: "/admin/settings", isComingSoon: true },
  { icon: "❓", label: "Pusat Bantuan", href: "/admin/help" },
];

export default function AdminSidebar({ collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin" && pathname === "/admin") return true;
    if (href !== "/admin" && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <Link href="/" className="sidebar-header">
        <div className="sidebar-logo" />
        <span>HRIS TeachApp</span>
      </Link>

      {onToggleCollapse && (
        <button className="sidebar-toggle" onClick={onToggleCollapse}>
          {collapsed ? "▶" : "◀"}
        </button>
      )}

      {/* Menu Sections */}
      <div className="sidebar-section">
        <div className="sidebar-label">Manajemen</div>
        {MENU_ITEMS.map((item) => (
          <div key={item.href} style={{ position: 'relative' }}>
            <Link
              href={item.isComingSoon ? "#" : item.href}
              className={`sidebar-item ${isActive(item.href) ? "active" : ""} ${item.isComingSoon ? "coming-soon" : ""}`}
              onClick={(e) => item.isComingSoon && e.preventDefault()}
              style={{ opacity: item.isComingSoon ? 0.6 : 1, cursor: item.isComingSoon ? 'default' : 'pointer' }}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">
                {item.label}
                {item.isComingSoon && !collapsed && (
                  <span style={{ 
                    fontSize: '8px', 
                    background: 'var(--ink-4)', 
                    color: 'white', 
                    padding: '2px 4px', 
                    borderRadius: '4px',
                    marginLeft: '8px',
                    verticalAlign: 'middle'
                  }}>SOON</span>
                )}
              </span>
            </Link>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Lainnya</div>
        {OTHER_ITEMS.map((item) => (
          <div key={item.href} style={{ position: 'relative' }}>
            <Link
              href={item.isComingSoon ? "#" : item.href}
              className={`sidebar-item ${isActive(item.href) ? "active" : ""} ${item.isComingSoon ? "coming-soon" : ""}`}
              onClick={(e) => item.isComingSoon && e.preventDefault()}
              style={{ opacity: item.isComingSoon ? 0.6 : 1, cursor: item.isComingSoon ? 'default' : 'pointer' }}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">
                {item.label}
                {item.isComingSoon && !collapsed && (
                  <span style={{ 
                    fontSize: '8px', 
                    background: 'var(--ink-4)', 
                    color: 'white', 
                    padding: '2px 4px', 
                    borderRadius: '4px',
                    marginLeft: '8px',
                    verticalAlign: 'middle'
                  }}>SOON</span>
                )}
              </span>
            </Link>
          </div>
        ))}
      </div>

      {/* User Profile at Bottom */}
      <div className="sidebar-footer">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            padding: "12px",
            borderRadius: "10px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #FACC15, #DC2626)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "14px",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            RH
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>Rizki Hidayat</div>
              <div style={{ fontSize: "11px", color: "var(--ink-3)", fontWeight: 500 }}>People Ops Lead</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
