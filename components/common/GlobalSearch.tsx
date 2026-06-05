"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Navigation, Zap, X } from "lucide-react";
import { dummyDocuments, EmployeeDocument } from "@/lib/dummy-data";

interface SearchResult {
  id: string;
  title: string;
  type: "menu" | "document" | "action";
  category?: string;
  href?: string;
  action?: () => void;
  icon?: string;
}

const MENUS = [
  { id: "m-profile", title: "Profil Saya", category: "Navigasi", href: "/employee/dashboard", icon: "👤" },
  { id: "m-docs", title: "Manajemen Dokumen", category: "Navigasi", href: "/employee/documents", icon: "📄" },
  { id: "m-assessments", title: "Asesmen", category: "Navigasi", href: "/employee/assessments", icon: "📋" },
  { id: "m-absensi", title: "Presensi (Coming Soon)", category: "Navigasi", href: "/employee/coming-soon?feature=Presensi", icon: "⏰" },
  { id: "m-payroll", title: "Payroll (Coming Soon)", category: "Navigasi", href: "/employee/coming-soon?feature=Payroll", icon: "💰" },
];

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.addEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    
    const menuResults: SearchResult[] = MENUS.filter(m => 
      m.title.toLowerCase().includes(q)
    ).map(m => ({ ...m, type: "menu" }));

    const docResults: SearchResult[] = dummyDocuments.filter(d => 
      d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
    ).map(d => ({
      id: d.id,
      title: d.title,
      type: "document",
      category: d.category,
      href: "/employee/documents", // Navigate to docs page
      icon: d.type === "PDF" ? "📕" : "🖼️"
    }));

    const actionResults: SearchResult[] = [];
    if ("tambah dokumen upload unggah".includes(q)) {
      actionResults.push({
        id: "act-add",
        title: "Tambah Dokumen Baru",
        type: "action",
        href: "/employee/documents?action=add", // Handle via query param or state
        icon: "➕"
      });
    }

    setResults([...menuResults, ...docResults, ...actionResults]);
  }, [query]);

  const handleSelect = (res: SearchResult) => {
    if (res.action) {
      res.action();
    } else if (res.href) {
      router.push(res.href);
    }
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative w-full max-w-[320px]" ref={dropdownRef}>
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 group-focus-within:text-[var(--red)] transition-colors">
          <Search size={16} />
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Cari (Ctrl+K)"
          className="topbar-search pl-10"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button 
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute top-full mt-2 w-[400px] max-h-[400px] overflow-y-auto bg-[var(--surface-focus)] border border-[var(--glass-border)] rounded-2xl z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {results.length > 0 ? (
            <div className="flex flex-col gap-1">
              {results.some(r => r.type === "menu") && (
                <div className="px-3 py-1.5 text-[10px] font-bold text-ink-3 uppercase tracking-wider">Navigasi</div>
              )}
              {results.filter(r => r.type === "menu").map(r => (
                <ResultItem key={r.id} result={r} onClick={() => handleSelect(r)} />
              ))}

              {results.some(r => r.type === "document") && (
                <div className="px-3 py-1.5 text-[10px] font-bold text-ink-3 uppercase tracking-wider mt-2">Dokumen Saya</div>
              )}
              {results.filter(r => r.type === "document").map(r => (
                <ResultItem key={r.id} result={r} onClick={() => handleSelect(r)} />
              ))}

              {results.some(r => r.type === "action") && (
                <div className="px-3 py-1.5 text-[10px] font-bold text-ink-3 uppercase tracking-wider mt-2">Aksi Cepat</div>
              )}
              {results.filter(r => r.type === "action").map(r => (
                <ResultItem key={r.id} result={r} onClick={() => handleSelect(r)} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-sm font-semibold text-ink">Tidak ada hasil ditemukan</div>
              <div className="text-xs text-ink-3 mt-1">Coba kata kunci lain seperti "SK" atau "Asesmen"</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultItem({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-[var(--line)] transition-all text-left group"
    >
      <div className="w-10 h-10 rounded-lg bg-[var(--surface-item)] flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
        {result.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-ink group-hover:text-[var(--red)] transition-colors">{result.title}</div>
        <div className="text-[11px] text-ink-3 flex items-center gap-1.5 mt-0.5 uppercase tracking-wide font-bold">
          {result.type === "menu" && <Navigation size={10} />}
          {result.type === "document" && <FileText size={10} />}
          {result.type === "action" && <Zap size={10} />}
          {result.category || result.type}
        </div>
      </div>
      <div className="text-[10px] text-ink-4 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
        ENTER ↵
      </div>
    </button>
  );
}
