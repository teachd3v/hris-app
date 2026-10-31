"use client";

import { useEffect, useState, useTransition } from "react";
import { Employee } from "@/types/employee";
import { useRouter } from "next/navigation";
import { loadScript } from "@/lib/utils/scriptLoader";
import AddEmployeeModal from "./AddEmployeeModal";
import Link from "next/link";
import { isTopLeader } from "@/lib/org";
import { updateEmployeeApprovalStatus, autoMatchManagers, type AutoMatchResult } from "@/app/admin/employees/actions";

interface AdminDashboardProps {
  employees: Employee[];
  isSuperAdmin?: boolean;
}

type ApprovalTab = "Semua" | "Menunggu" | "Disetujui" | "Ditolak";

export default function AdminDashboard({ employees: initialEmployees, isSuperAdmin = false }: AdminDashboardProps) {
  const [employees, setEmployees] = useState(initialEmployees);
  // Sinkronkan dengan data server setelah router.refresh() (tambah karyawan, cocokkan atasan, dst.)
  useEffect(() => { setEmployees(initialEmployees); }, [initialEmployees]);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("Semua");
  const [activeTab, setActiveTab] = useState<ApprovalTab>("Semua");
  const [modalEmp, setModalEmp] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<AutoMatchResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<"Karyawan" | "Admin">("Karyawan");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const withoutManager = employees.filter((e: any) => !e.manager_id && !isTopLeader(e) && (e.approval_status || 'Approved') !== 'Rejected');

  const handleAutoMatch = async () => {
    setMatching(true);
    try {
      const res = await autoMatchManagers();
      setMatchResult(res);
      router.refresh();
    } finally {
      setMatching(false);
    }
  };

  const pendingCount = employees.filter(e => (e as any).approval_status === 'Pending').length;

  const tabFiltered = employees.filter(e => {
    const status = (e as any).approval_status || 'Approved';
    if (activeTab === "Menunggu") return status === 'Pending';
    if (activeTab === "Disetujui") return status === 'Approved';
    if (activeTab === "Ditolak") return status === 'Rejected';
    return true;
  });

  const filtered = tabFiltered.filter((e) => {
    if (selectedDept !== "Semua" && e.department !== selectedDept) return false;
    if (search) {
      const s = search.toLowerCase();
      const searchStr = `${e.fullName} ${e.position} ${e.department} ${(e as any).employee_code || ''} ${e.email || ''}`.toLowerCase();
      if (!searchStr.includes(s)) return false;
    }
    return true;
  });

  const departments = new Set(employees.map(e => e.department).filter(Boolean));
  const contractCount = employees.filter(e => (e as any).status === 'Kontrak').length;
  const permanentCount = employees.filter(e => (e as any).status === 'Tetap').length;

  const handleExportCSV = async () => {
    if (filtered.length === 0) return;
    await loadScript("https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js");
    const XLSX = (window as any).XLSX;
    const exportData = filtered.map(emp => ({
      "NIK": (emp as any).employee_code || "",
      "Nama Lengkap": emp.fullName,
      "Email Pribadi": emp.email,
      "Email Lembaga": (emp as any).institutional_email || "-",
      "Jabatan": emp.position,
      "Departemen": emp.department,
      "Status Kepegawaian": (emp as any).status || "-",
      "Status Approval": (emp as any).approval_status || "Approved",
      "Role": (emp as any).role || "Karyawan",
      "Kelengkapan Data (%)": (emp as any).profileProgress || 0,
      "Total Dokumen": (emp as any).documentCount || 0
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Karyawan");
    XLSX.writeFile(workbook, `Rekap_Karyawan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleApprove = (emp: any) => {
    setSelectedRole('Karyawan');
    setModalEmp(emp);
  };

  const confirmApprove = () => {
    if (!modalEmp) return;
    startTransition(async () => {
      const res = await updateEmployeeApprovalStatus(modalEmp.id, 'Approved', selectedRole);
      if (res?.error) { alert(res.error); return; }
      setEmployees(prev => prev.map(e => e.id === modalEmp.id ? { ...e, approval_status: 'Approved', role: selectedRole } as any : e));
      setModalEmp(null);
    });
  };

  const handleReject = (emp: any) => {
    startTransition(async () => {
      const res = await updateEmployeeApprovalStatus(emp.id, 'Rejected');
      if (res?.error) { alert(res.error); return; }
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, approval_status: 'Rejected' } as any : e));
    });
  };

  const handleReset = (emp: any) => {
    startTransition(async () => {
      const res = await updateEmployeeApprovalStatus(emp.id, 'Pending');
      if (res?.error) { alert(res.error); return; }
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, approval_status: 'Pending' } as any : e));
    });
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'Approved': return { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', color: '#16a34a', label: '✓ Disetujui' };
      case 'Rejected': return { bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.25)', color: '#dc2626', label: '✗ Ditolak' };
      default: return { bg: 'rgba(255,170,0,0.12)', border: 'rgba(255,170,0,0.3)', color: '#d97706', label: '⏳ Menunggu' };
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Tetap': return 'bg-green-100 text-green-600';
      case 'Kontrak': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const TABS: ApprovalTab[] = ["Semua", "Menunggu", "Disetujui", "Ditolak"];

  return (
    <div className="flex flex-col gap-5">
      <AddEmployeeModal open={showAddModal} onClose={() => setShowAddModal(false)} onCreated={() => router.refresh()} />
      {/* Page Header */}
      <div className="page-head items-end justify-between">
        <div>
          <span className="eyebrow">Management Dashboard</span>
          <h1>Direktori Karyawan</h1>
          <p>Kelola {employees.length} data karyawan di dalam sistem.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={handleExportCSV}>📥 Ekspor CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>➕ Tambah Karyawan</button>
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

      {/* Approval Tabs */}
      <div className="glass p-4 rounded-[18px] flex flex-col gap-3">
        {/* Tab Pills */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-hris-red text-white shadow-md'
                  : 'bg-black/5 text-ink-3 hover:bg-black/10'
              }`}
            >
              {tab}
              {tab === "Menunggu" && pendingCount > 0 && (
                <span className="ml-1.5 bg-white/30 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
          {/* Search */}
          <div className="flex-1 min-w-[200px] h-[38px] rounded-lg bg-white/50 border border-[var(--glass-border-inner)] flex items-center gap-2.5 px-3 text-ink-3 text-sm ml-auto">
            <span>🔍</span>
            <input
              placeholder="Cari nama, NIK, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent outline-none flex-1 font-jakarta text-ink"
            />
          </div>
        </div>
      </div>

      {/* Pending Warning Banner */}
      {pendingCount > 0 && activeTab === "Semua" && (
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-2xl"
          style={{
            background: 'rgba(255,170,0,0.1)',
            border: '1px solid rgba(255,170,0,0.3)',
          }}
        >
          <span className="text-2xl">⏳</span>
          <div>
            <div className="text-sm font-bold text-amber-700">
              {pendingCount} akun menunggu persetujuan
            </div>
            <div className="text-xs text-amber-600">
              Klik tab "Menunggu" untuk meninjau dan menyetujui akun-akun tersebut.
            </div>
          </div>
          <button
            onClick={() => setActiveTab("Menunggu")}
            className="ml-auto text-xs font-bold text-amber-700 underline whitespace-nowrap"
          >
            Tinjau Sekarang →
          </button>
        </div>
      )}

      {(withoutManager.length > 0 || matchResult) && (
        <div className="flex flex-col gap-3 px-5 py-4 rounded-2xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl">🧭</span>
            <div>
              <div className="text-sm font-bold text-indigo-800">
                {withoutManager.length > 0 ? `${withoutManager.length} karyawan belum punya atasan langsung` : "Semua karyawan sudah punya atasan"}
              </div>
              <div className="text-xs text-indigo-700">Karyawan tanpa atasan tidak dapat mengajukan cuti. Atur di halaman detail karyawan, atau cocokkan otomatis dari nama atasan di data lama.</div>
            </div>
            {withoutManager.length > 0 && (
              <button onClick={handleAutoMatch} disabled={matching} className="ml-auto btn btn-primary btn-sm disabled:opacity-60">
                {matching ? "Mencocokkan..." : "Cocokkan Otomatis"}
              </button>
            )}
          </div>
          {matchResult && (
            <div className="text-xs text-indigo-900 flex flex-col gap-1.5" role="status">
              <div className="font-bold">{matchResult.matched} karyawan berhasil dicocokkan{matchResult.unmatched.length > 0 ? `, ${matchResult.unmatched.length} perlu diatur manual:` : "."}</div>
              {matchResult.unmatched.length > 0 && (
                <ul className="max-h-40 overflow-y-auto flex flex-col gap-1">
                  {matchResult.unmatched.map((u) => (
                    <li key={u.id}>
                      <Link href={`/admin/employees/${u.id}`} className="font-semibold underline">{u.name || u.id}</Link>
                      <span className="text-indigo-700"> — {u.reason}{u.manager ? ` ("${u.manager}")` : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-ink-3 font-medium">
            Tidak ada data karyawan untuk filter ini.
          </div>
        )}
        {filtered.map((emp: any) => {
          const profileProgress = emp.profileProgress || 0;
          const approvalStatus = emp.approval_status || 'Approved';
          const badge = getApprovalBadge(approvalStatus);

          return (
            <div
              key={emp.id}
              className="glass p-5 flex flex-col gap-4 hover:translate-y-[-2px] transition-all group relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div
                  className="flex gap-3 items-center flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/admin/employees/${emp.id}`)}
                >
                  {emp.photo ? (
                    <img src={emp.photo} alt={emp.fullName} className="w-11 h-11 rounded-xl object-cover shadow-sm flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-hris-yellow to-hris-red flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0">
                      {emp.fullName?.split(" ").map((n: any) => n[0]).join("").substring(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-ink uppercase tracking-wider text-[11px] leading-tight">{emp.employee_code || 'ID-NEW'}</div>
                    <div className="text-sm font-semibold text-ink truncate mt-0.5">{emp.fullName}</div>
                    <div className="text-[11px] text-ink-3 truncate">{emp.position || 'Belum diatur'}</div>
                  </div>
                </div>
              </div>

              {/* Approval Status Badge */}
              <div
                className="flex items-center justify-between px-3 py-1.5 rounded-xl"
                style={{ background: badge.bg, border: `1px solid ${badge.border}` }}
              >
                <span className="text-[11px] font-bold" style={{ color: badge.color }}>{badge.label}</span>
                <span className="text-[10px] font-medium text-ink-3">{emp.role || 'Karyawan'}</span>
              </div>

              {/* Progress */}
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

              {/* Action Buttons */}
              <div className="flex gap-2">
                {approvalStatus === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(emp)}
                      disabled={isPending}
                      className="flex-1 text-[11px] font-bold py-2 rounded-xl text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                    >
                      ✓ Setujui
                    </button>
                    <button
                      onClick={() => handleReject(emp)}
                      disabled={isPending}
                      className="flex-1 text-[11px] font-bold py-2 rounded-xl text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
                    >
                      ✗ Tolak
                    </button>
                  </>
                )}
                {approvalStatus === 'Approved' && (
                  <>
                    <button
                      onClick={() => router.push(`/admin/employees/${emp.id}`)}
                      className="flex-1 text-[11px] font-bold py-2 rounded-xl bg-black/5 text-ink-2 hover:bg-black/10 transition-all"
                    >
                      Lihat Profil →
                    </button>
                    <button
                      onClick={() => handleReject(emp)}
                      disabled={isPending}
                      className="text-[11px] font-bold py-2 px-3 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 transition-all"
                    >
                      Tolak
                    </button>
                  </>
                )}
                {approvalStatus === 'Rejected' && (
                  <button
                    onClick={() => handleReset(emp)}
                    disabled={isPending}
                    className="w-full text-[11px] font-bold py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
                  >
                    🔄 Reset ke Pending
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Approve Modal */}
      {modalEmp && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalEmp(null); }}
        >
          <div
            className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl"
            style={{ border: '1px solid rgba(0,0,0,0.08)' }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-3xl mx-auto mb-3">✅</div>
              <h2 className="text-xl font-black text-ink">Setujui Akun</h2>
              <p className="text-sm text-ink-3 mt-1">
                Tentukan role untuk <strong>{modalEmp.fullName || modalEmp.email}</strong>
              </p>
            </div>

            <div className="flex gap-3 mb-6">
              {((isSuperAdmin ? ['Karyawan', 'Admin'] : ['Karyawan']) as ('Karyawan' | 'Admin')[]).map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: selectedRole === r ? 'linear-gradient(135deg, #FF6B35, #FFAA00)' : 'rgba(0,0,0,0.05)',
                    color: selectedRole === r ? 'white' : '#666',
                    border: selectedRole === r ? 'none' : '1px solid #e5e7eb',
                  }}
                >
                  {r === 'Karyawan' ? '👤 Karyawan' : '🛡️ Admin'}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalEmp(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={confirmApprove}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                {isPending ? 'Menyimpan...' : 'Konfirmasi ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
