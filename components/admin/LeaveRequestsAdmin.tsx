"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { approveByHC, listAdminRequests, type LeaveRequest } from "@/app/employee/cuti/actions";
import ApprovalList from "@/components/cuti/ApprovalList";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  PENDING_DIRECT_MANAGER: { text: "Menunggu Atasan", cls: "bg-orange-50 text-orange-600 border-orange-100" },
  PENDING_HC_ADMIN: { text: "Menunggu HC", cls: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  APPROVED: { text: "Disetujui", cls: "bg-green-50 text-green-600 border-green-100" },
  REJECTED: { text: "Ditolak", cls: "bg-red-50 text-red-600 border-red-100" },
};

const fmt = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default function LeaveRequestsAdmin() {
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [all, setAll] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAll(await listAdminRequests());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Yang paling lama menunggu tampil paling atas
  const pending = all.filter((r) => r.status === "PENDING_HC_ADMIN").sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="flex flex-col gap-5">
      <div className="page-head">
        <div>
          <span className="eyebrow">Manajemen Cuti</span>
          <h1>Pengajuan Cuti</h1>
          <p>Persetujuan akhir HC dan riwayat seluruh pengajuan karyawan.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {([["pending", `Menunggu HC (${pending.length})`], ["all", "Semua Riwayat"]] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`px-4 py-2 rounded-full text-xs font-bold border ${tab === key ? "bg-ink text-white border-ink" : "bg-white text-ink-2 border-line-2"}`}>{label}</button>
        ))}
      </div>

      <div className="glass p-5">
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
        ) : tab === "pending" ? (
          <ApprovalList
            requests={pending}
            emptyText="Tidak ada pengajuan yang menunggu persetujuan HC."
            onDecide={async (id, approve, notes) => {
              const res = await approveByHC(id, approve, notes);
              if (!res.error) await load();
              return res;
            }}
          />
        ) : all.length === 0 ? (
          <p className="text-sm text-ink-3 text-center py-8">Belum ada pengajuan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-ink-3 text-left">
                  <th className="py-2 pr-3">Karyawan</th>
                  <th className="py-2 px-2">Jenis</th>
                  <th className="py-2 px-2">Tanggal</th>
                  <th className="py-2 px-2 text-right">Hari</th>
                  <th className="py-2 pl-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {all.map((r) => {
                  const st = STATUS_LABEL[r.status] ?? { text: r.status, cls: "bg-gray-50 text-gray-500 border-gray-100" };
                  return (
                    <tr key={r.id} className="border-t border-line-2">
                      <td className="py-2 pr-3 font-semibold text-ink">{r.employee_name}</td>
                      <td className="py-2 px-2 text-ink-2">{r.leave_type}</td>
                      <td className="py-2 px-2 text-ink-2 whitespace-nowrap">{fmt(r.start_date)} - {fmt(r.end_date)}</td>
                      <td className="py-2 px-2 text-right text-ink-2">{r.duration_days}</td>
                      <td className="py-2 pl-2"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${st.cls}`}>{st.text}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
