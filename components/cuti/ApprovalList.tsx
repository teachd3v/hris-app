"use client";

import { useState } from "react";
import { Check, Loader2, X, FileText } from "lucide-react";
import type { LeaveRequest } from "@/app/employee/cuti/actions";

const fmt = (d: string) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

/** Daftar pengajuan menunggu persetujuan dengan catatan + tombol Setujui/Tolak. Dipakai atasan dan HC Admin. */
export default function ApprovalList({
  requests,
  onDecide,
  emptyText = "Tidak ada pengajuan yang menunggu.",
}: {
  requests: LeaveRequest[];
  onDecide: (id: string, approve: boolean, notes: string) => Promise<{ error?: string }>;
  emptyText?: string;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});

  const decide = async (id: string, approve: boolean) => {
    setBusy(`${id}:${approve}`);
    setError((e) => ({ ...e, [id]: "" }));
    try {
      const res = await onDecide(id, approve, notes[id] ?? "");
      if (res.error) setError((e) => ({ ...e, [id]: res.error! }));
    } catch {
      setError((e) => ({ ...e, [id]: "Terjadi kesalahan, coba lagi" }));
    } finally {
      setBusy(null);
    }
  };

  if (requests.length === 0) return <p className="text-[12px] text-ink-3 py-6 text-center">{emptyText}</p>;

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const who = (r as any).employees?.name || r.employee_name || "Karyawan";
        return (
          <div key={r.id} className="border border-line rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-white bg-ink px-2.5 py-0.5 rounded-md">{r.leave_type}</span>
              <span className="text-[13px] font-extrabold text-ink">{who}</span>
              {(r as any).employees?.dept && <span className="text-[11px] text-ink-3">{(r as any).employees.dept}</span>}
            </div>
            <p className="text-[13px] font-bold text-ink">
              {fmt(r.start_date)} - {fmt(r.end_date)} <span className="text-ink-3 font-medium text-[12px]">({r.duration_days} hari)</span>
            </p>
            {(r.start_time || r.end_time) && <p className="text-[11px] text-[var(--red)] font-bold">Jam: {r.start_time || "--:--"} - {r.end_time || "--:--"}</p>}
            <p className="text-[12px] text-ink-2">Alasan: &ldquo;{r.reason}&rdquo;</p>
            {r.manager_notes && <p className="text-[11px] text-ink-3">Catatan atasan: &ldquo;{r.manager_notes}&rdquo;</p>}
            {r.attachment_url && (
              <a href={r.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline">
                <FileText size={12} /> Lihat Lampiran
              </a>
            )}
            <input
              maxLength={500}
              placeholder="Catatan (opsional)"
              value={notes[r.id] ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-line-2 bg-white text-[12px] text-ink outline-none focus:border-ink"
            />
            {error[r.id] && <p role="alert" className="text-[11px] font-medium text-red-600">{error[r.id]}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" disabled={busy !== null} onClick={() => decide(r.id, false)} className="px-4 py-2 rounded-xl text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 flex items-center gap-1.5 disabled:opacity-50">
                {busy === `${r.id}:false` ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Tolak
              </button>
              <button type="button" disabled={busy !== null} onClick={() => decide(r.id, true)} className="px-4 py-2 rounded-xl text-[11px] font-bold text-white bg-green-600 hover:bg-green-700 flex items-center gap-1.5 disabled:opacity-50">
                {busy === `${r.id}:true` ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Setujui
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
