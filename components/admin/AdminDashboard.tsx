"use client";

import { useState, useEffect } from "react";
import { Employee } from "@/types/employee";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface AdminDashboardProps {
  employees: Employee[];
}

export default function AdminDashboard({ employees: initialEmployees }: AdminDashboardProps) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("Semua");
  const router = useRouter();
  // Real-time subscription removed for D1 (Cloudflare)

  const filtered = employees.filter((e) => {
    if (selectedDept !== "Semua" && e.department !== selectedDept) return false;
    if (search) {
      const s = search.toLowerCase();
      const searchStr = `${e.fullName} ${e.position} ${e.department} ${(e as any).employee_code || ''} ${e.email || ''}`.toLowerCase();
      if (!searchStr.includes(s)) return false;
    }
    return true;
  });

  // Calculate new stats
  const departments = new Set(employees.map(e => e.department).filter(Boolean));
  const contractCount = employees.filter(e => (e as any).status === 'Kontrak').length;
  const permanentCount = employees.filter(e => (e as any).status === 'Tetap').length;

  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const exportData = filtered.map(emp => ({
      "NIK": (emp as any).employee_code || "",
      "Nama Lengkap": emp.fullName,
      "Email": emp.email,
      "Jabatan": emp.position,
      "Departemen": emp.department,
      "Status": (emp as any).status || "Pending",
      "Kelengkapan Data (%)": (emp as any).profileProgress || 0,
      "Total Dokumen": (emp as any).documentCount || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Karyawan");
    
    // Download
    XLSX.writeFile(workbook, `Rekap_Karyawan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header Card */}
      <div className="page-head items-end justify-between">
        <div>
          <span className="eyebrow">Management Dashboard</span>
          <h1>Direktori Karyawan</h1>
          <p>Kelola {employees.length} data karyawan di dalam sistem.</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-ghost btn-sm"
            onClick={handleExportCSV}
          >
            📥 Ekspor CSV
          </button>
          <button className="btn btn-primary btn-sm">➕ Tambah Karyawan</button>
        </div>
      </div>

      {/* Stat Tiles */}
      <div className="stat-row">
        <div className="stat glass">
          <span className="s-label">Total Karyawan</span>
          <span className="s-val">{employees.length}</span>
          <span className="s-ic">👥</span>
        </div>
        <div className="stat glass">
          <span className="s-label">Total Departemen</span>
          <span className="s-val">{departments.size || 1}</span>
          <span className="s-ic">🏢</span>
        </div>
        <div className="stat glass">
          <span className="s-label">Karyawan Kontrak</span>
          <span className="s-val">{contractCount}</span>
          <span className="s-ic">📄</span>
        </div>
        <div className="stat glass">
          <span className="s-label">Karyawan Tetap</span>
          <span className="s-val">{permanentCount}</span>
          <span className="s-ic">🛡️</span>
        </div>
      </div>

      {/* Filter Section */}
      <div className="glass p-4 rounded-[18px] flex flex-col gap-3">
        <div className="flex gap-2.5 items-center">
          <div className="flex-1 min-w-[220px] h-[38px] rounded-lg bg-white/50 border border-[var(--glass-border-inner)] flex items-center gap-2.5 px-3 text-ink-3 text-sm">
            <span>🔍</span>
            <input
              placeholder="Cari nama, NIK, posisi…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent outline-none flex-1 font-jakarta text-ink"
            />
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((emp: any) => {
          const profileProgress = emp.profileProgress || 0;
          
          const getStatusStyles = (status: string) => {
            switch(status) {
              case 'Tetap': return 'bg-green-100 text-green-600';
              case 'Kontrak': return 'bg-blue-100 text-blue-600';
              case 'Pending': 
              case 'Belum Aktif':
              default: return 'bg-red-100 text-red-600';
            }
          };
          
          return (
            <div 
              key={emp.id} 
              className="glass p-5 flex flex-col gap-4 hover:translate-y-[-4px] transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => router.push(`/admin/employees/${emp.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3 items-center">
                  {emp.photo ? (
                    <img src={emp.photo} alt={emp.fullName} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-hris-yellow to-hris-red flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {emp.fullName?.split(" ").map((n: any) => n[0]).join("").substring(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-ink uppercase tracking-wider text-sm leading-tight">{emp.employee_code || 'ID-NEW'}</div>
                    <div className="text-[11px] text-ink-3 font-medium truncate mt-0.5">{emp.fullName}</div>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold ${getStatusStyles(emp.status)}`}>
                  {emp.status || 'Pending'}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[11px] text-ink-2 font-medium">
                  <span className="opacity-60">💼</span>
                  <span className="truncate">{emp.position}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-ink-2 font-medium">
                  <span className="opacity-60">🏢</span>
                  <span className="truncate">{emp.department}</span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="mt-2 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-ink-3">
                    <span>KELENGKAPAN DATA</span>
                    <span className={profileProgress === 100 ? "text-green-600" : ""}>{profileProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${profileProgress === 100 ? 'bg-green-500' : 'bg-hris-yellow'}`}
                      style={{ width: `${profileProgress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/40 border border-white/40">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink-2">
                    <span className="text-sm">📄</span>
                    <span>Total Dokumen</span>
                  </div>
                  <span className="text-xs font-bold text-ink">{emp.documentCount || 0} File</span>
                </div>
              </div>

              <div className="absolute bottom-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold text-hris-red">Lihat Profil Lengkap →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
