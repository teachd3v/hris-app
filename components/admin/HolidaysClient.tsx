"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteHoliday, listHolidays, saveHolidays, type HolidayRow } from "@/app/admin/holidays/actions";
import { HOLIDAY_TYPES, parseIsoDate } from "@/lib/leave";

const typeLabel = (t: string) => HOLIDAY_TYPES.find((x) => x.key === t)?.label ?? t;
const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Semua tanggal dari start sampai end (inklusif), maks. 60 hari. */
function expandRange(start: string, end: string): string[] | null {
  const s = parseIsoDate(start);
  const e = parseIsoDate(end || start);
  if (!s || !e || e < s) return null;
  const out: string[] = [];
  for (const d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out.length > 60 ? null : out;
}

export default function HolidaysClient() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [rows, setRows] = useState<HolidayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("NATIONAL");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listHolidays(year));
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const submit = async (entries: HolidayRow[], onDone?: () => void) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await saveHolidays(entries);
      if (res.error) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: `${res.saved} tanggal tersimpan` });
      onDone?.();
      await load();
    } catch {
      setMessage({ ok: false, text: "Terjadi kesalahan, coba lagi" });
    } finally {
      setBusy(false);
    }
  };

  const addOne = (e: React.FormEvent) => {
    e.preventDefault();
    const dates = expandRange(start, end);
    if (!dates) return setMessage({ ok: false, text: "Rentang tanggal tidak valid (maks. 60 hari)" });
    submit(dates.map((date) => ({ date, name: name.trim(), type })), () => { setStart(""); setEnd(""); setName(""); });
  };

  const importBulk = () => {
    const entries: HolidayRow[] = [];
    for (const [i, raw] of bulk.split("\n").entries()) {
      const line = raw.trim();
      if (!line) continue;
      const [date, nm, kind] = line.split(/[,;\t]/).map((x) => x.trim());
      if (!parseIsoDate(date ?? "") || !nm) return setMessage({ ok: false, text: `Baris ${i + 1} tidak valid: "${line}". Format: 2026-08-17, Hari Kemerdekaan RI, nasional` });
      const k = (kind || "nasional").toLowerCase();
      entries.push({ date, name: nm, type: k.startsWith("bersama") || k === "joint" ? "JOINT" : "NATIONAL" });
    }
    if (entries.length === 0) return setMessage({ ok: false, text: "Tempel daftar libur terlebih dahulu" });
    submit(entries, () => setBulk(""));
  };

  const remove = async (h: HolidayRow) => {
    if (!confirm(`Hapus ${h.name} (${fmt(h.date)})?`)) return;
    setBusy(true);
    const res = await deleteHoliday(h.date);
    setBusy(false);
    setMessage(res.error ? { ok: false, text: res.error } : { ok: true, text: "Hari libur dihapus" });
    await load();
  };

  const inputCls = "h-10 px-3 rounded-xl border border-line-2 bg-white text-sm text-ink outline-none focus:border-[var(--red)]";

  return (
    <div className="flex flex-col gap-5">
      <div className="page-head items-end justify-between">
        <div>
          <span className="eyebrow">Manajemen Cuti</span>
          <h1>Hari Libur</h1>
          <p>Libur nasional dan cuti bersama tidak dihitung sebagai hari kerja pada pengajuan cuti (berlaku untuk pengajuan baru).</p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-10 px-3 rounded-xl border border-line-2 bg-white text-sm font-bold text-ink">
          {[thisYear - 1, thisYear, thisYear + 1, thisYear + 2].map((y) => <option key={y} value={y}>Tahun {y}</option>)}
        </select>
      </div>

      <form onSubmit={addOne} className="glass p-5 flex flex-col gap-3">
        <h3 className="text-sm font-black text-ink">Tambah Hari Libur</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <label className="flex flex-col gap-1 text-[11px] font-bold text-ink-3 uppercase tracking-wider">Tanggal
            <input type="date" required value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-ink-3 uppercase tracking-wider">Sampai (opsional)
            <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-ink-3 uppercase tracking-wider md:col-span-2">Nama
            <input required maxLength={100} placeholder="mis. Hari Kemerdekaan RI" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-bold text-ink-3 uppercase tracking-wider">Jenis
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {HOLIDAY_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className="btn btn-primary btn-sm flex items-center gap-2 disabled:opacity-60">
            {busy && <Loader2 size={14} className="animate-spin" />} Tambah
          </button>
          <button type="button" onClick={() => setShowBulk((v) => !v)} className="text-xs font-bold text-ink-2 underline">
            {showBulk ? "Tutup impor massal" : "Impor banyak sekaligus"}
          </button>
        </div>
        {showBulk && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-ink-3">Satu baris per tanggal: <code>tanggal, nama, jenis</code> (jenis: <code>nasional</code> atau <code>bersama</code>, default nasional). Tanggal yang sudah ada akan diperbarui.</p>
            <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={6} placeholder={"2026-08-17, Hari Kemerdekaan RI, nasional\n2026-12-24, Cuti Bersama Natal, bersama"} className="w-full p-3 rounded-xl border border-line-2 bg-white text-sm font-mono text-ink outline-none focus:border-[var(--red)]" />
            <div><button type="button" onClick={importBulk} disabled={busy} className="btn btn-ghost btn-sm disabled:opacity-60">Impor</button></div>
          </div>
        )}
        {message && <p role="status" className={`text-xs font-medium ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
      </form>

      <div className="glass p-5">
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-3 text-center py-8">Belum ada hari libur untuk tahun {year}. Tambahkan sesuai SKB resmi pemerintah.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-ink-3 text-left">
                <th className="py-2 pr-3">Tanggal</th><th className="py-2 px-2">Nama</th><th className="py-2 px-2">Jenis</th><th className="py-2 pl-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.date} className="border-t border-line-2">
                  <td className="py-2 pr-3 font-semibold text-ink whitespace-nowrap">{fmt(h.date)}</td>
                  <td className="py-2 px-2 text-ink-2">{h.name}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${h.type === "JOINT" ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-red-50 text-red-600 border-red-100"}`}>{typeLabel(h.type)}</span>
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <button type="button" onClick={() => remove(h)} disabled={busy} aria-label={`Hapus ${h.name}`} className="p-2 text-ink-3 hover:text-red-600 disabled:opacity-50"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
