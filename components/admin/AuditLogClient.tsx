"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { listAuditLogs, type AuditLogRow } from "@/app/admin/audit/actions";
import { AUDIT_ACTION_LABELS } from "@/lib/audit-labels";

type Cursor = { at: string; id: string } | null;

const fmtWib = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Ringkasan satu baris dari objek detail: kunci: nilai. */
function summarize(details: Record<string, unknown> | null): string {
  if (!details) return "";
  const parts: string[] = [];
  for (const [k, v] of Object.entries(details)) {
    if (v === undefined || v === null) continue;
    if (k === "changes" && typeof v === "object") {
      parts.push(Object.entries(v as Record<string, { from: unknown; to: unknown }>).map(([t, c]) => `${t}: ${c.from ?? "default"} → ${c.to ?? "default"}`).join("; "));
    } else if (k === "from" || k === "to") {
      continue;
    } else {
      parts.push(`${k}: ${Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)}`);
    }
  }
  if ("from" in details || "to" in details) parts.unshift(`${details.from ?? "—"} → ${details.to ?? "—"}`);
  return parts.join(" • ");
}

export default function AuditLogClient() {
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [next, setNext] = useState<Cursor>(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (append: boolean, cursor: Cursor) => {
    append ? setMore(true) : setLoading(true);
    setError(null);
    try {
      const res = await listAuditLogs({ action, actor, from, to }, cursor);
      if (res.error) return setError(res.error);
      setRows((prev) => (append ? [...prev, ...res.rows] : res.rows));
      setNext(res.next);
    } catch {
      setError("Gagal memuat log audit");
    } finally {
      setLoading(false);
      setMore(false);
    }
  }, [action, actor, from, to]);

  // Muat ulang saat filter berubah (pencarian pelaku ditunda agar tidak query tiap ketikan)
  useEffect(() => {
    const t = setTimeout(() => load(false, null), 300);
    return () => clearTimeout(t);
  }, [load]);

  const inputCls = "h-10 px-3 rounded-xl border border-line-2 bg-white text-sm text-ink outline-none focus:border-[var(--red)]";

  return (
    <div className="flex flex-col gap-5">
      <div className="page-head">
        <div>
          <span className="eyebrow">Khusus Super Admin</span>
          <h1>Log Audit</h1>
          <p>Riwayat tindakan sensitif. Log hanya bisa ditambah, tidak bisa diubah atau dihapus dari aplikasi. Waktu dalam WIB.</p>
        </div>
      </div>

      <div className="glass p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select value={action} onChange={(e) => setAction(e.target.value)} className={inputCls} aria-label="Filter aksi">
          <option value="">Semua aksi</option>
          {Object.entries(AUDIT_ACTION_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Cari pelaku (nama/email)" className={inputCls} aria-label="Cari pelaku" />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} aria-label="Dari tanggal" />
        <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputCls} aria-label="Sampai tanggal" />
      </div>

      <div className="glass p-5">
        {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-3 text-center py-8">Belum ada catatan untuk filter ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-ink-3 text-left">
                  <th className="py-2 pr-3">Waktu</th><th className="py-2 px-2">Pelaku</th><th className="py-2 px-2">Aksi</th>
                  <th className="py-2 px-2">Target</th><th className="py-2 px-2">Detail</th><th className="py-2 pl-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line-2 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap text-ink-2">{fmtWib(r.at)}</td>
                    <td className="py-2 px-2"><div className="font-semibold text-ink">{r.actor_name || "—"}</div><div className="text-[11px] text-ink-3">{r.actor_email || "sistem"}</div></td>
                    <td className="py-2 px-2 font-semibold text-ink whitespace-nowrap">{AUDIT_ACTION_LABELS[r.action as keyof typeof AUDIT_ACTION_LABELS] ?? r.action}</td>
                    <td className="py-2 px-2 text-ink-2">{r.target_label || "—"}</td>
                    <td className="py-2 px-2 text-[12px] text-ink-3 max-w-[340px] break-words">{summarize(r.details)}</td>
                    <td className="py-2 pl-2 text-[11px] text-ink-3 whitespace-nowrap">{r.ip || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {next && !loading && (
          <div className="pt-4 flex justify-center">
            <button type="button" onClick={() => load(true, next)} disabled={more} className="btn btn-ghost btn-sm flex items-center gap-2 disabled:opacity-60">
              {more && <Loader2 size={14} className="animate-spin" />} Muat lebih banyak
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
