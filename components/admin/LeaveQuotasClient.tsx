"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { getQuotaEmployees, getEmployeeBalances, saveEmployeeQuotas, type QuotaEmployee } from "@/app/admin/leave-quotas/actions";
import type { LeaveBalance } from "@/lib/leave-balance";

export default function LeaveQuotasClient() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [employees, setEmployees] = useState<QuotaEmployee[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<QuotaEmployee | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loadingList, setLoadingList] = useState(true);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      setEmployees(await getQuotaEmployees(year));
    } finally {
      setLoadingList(false);
    }
  }, [year]);

  const loadEditor = useCallback(async (emp: QuotaEmployee, y: number) => {
    setLoadingEditor(true);
    setMessage(null);
    try {
      const b = await getEmployeeBalances(emp.id, y);
      setBalances(b);
      // Input terisi hanya untuk jatah khusus; kosong = pakai default
      setInputs(Object.fromEntries(b.map((x) => [x.type, x.explicit && x.quota !== null ? String(x.quota) : ""])));
    } finally {
      setLoadingEditor(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (selected) loadEditor(selected, year); }, [selected, year, loadEditor]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    const payload: Record<string, number | null> = {};
    for (const b of balances) {
      const raw = (inputs[b.type] ?? "").trim().replace(",", ".");
      if (raw === "") {
        if (b.explicit) payload[b.type] = null; // dihapus -> kembali ke default
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        setSaving(false);
        return setMessage({ ok: false, text: `Jatah ${b.type} harus berupa angka` });
      }
      if (!b.explicit || b.quota !== n) payload[b.type] = n;
    }
    try {
      const res = await saveEmployeeQuotas(selected.id, year, payload);
      if (res.error) return setMessage({ ok: false, text: res.error });
      await Promise.all([loadEditor(selected, year), loadList()]);
      setMessage({ ok: true, text: "Jatah cuti tersimpan" });
    } catch {
      setMessage({ ok: false, text: "Terjadi kesalahan, coba lagi" });
    } finally {
      setSaving(false);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = employees.filter((e) => !q || `${e.name ?? ""} ${e.email ?? ""} ${e.dept ?? ""}`.toLowerCase().includes(q));
  const inputCls = "w-32 h-9 px-2 rounded-lg border border-line-2 bg-white text-sm text-ink text-right outline-none focus:border-[var(--red)]";

  return (
    <div className="flex flex-col gap-5">
      <div className="page-head items-end justify-between">
        <div>
          <span className="eyebrow">Manajemen Cuti</span>
          <h1>Kuota Cuti</h1>
          <p>Atur jatah setiap jenis cuti untuk masing-masing karyawan.</p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-10 px-3 rounded-xl border border-line-2 bg-white text-sm font-bold text-ink">
          {[thisYear - 1, thisYear, thisYear + 1].map((y) => <option key={y} value={y}>Tahun {y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 glass p-4 flex flex-col gap-3 max-h-[70vh]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, email, departemen" className="w-full h-10 pl-9 pr-3 rounded-xl border border-line-2 bg-white text-sm outline-none focus:border-[var(--red)]" />
          </div>
          <div className="overflow-y-auto flex flex-col gap-1.5">
            {loadingList ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-ink-3 text-center py-6">Tidak ada karyawan.</p>
            ) : (
              filtered.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelected(e)}
                  className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${selected?.id === e.id ? "border-[var(--red)] bg-red-50" : "border-line-2 bg-white hover:border-ink/30"}`}
                >
                  <div className="text-sm font-bold text-ink truncate">{e.name || e.email}</div>
                  <div className="text-[11px] text-ink-3 truncate">{[e.title, e.dept].filter(Boolean).join(" • ") || e.email}</div>
                  {e.customCount > 0 && <div className="text-[10px] font-bold text-[var(--red)] mt-0.5">{e.customCount} jatah khusus</div>}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 glass p-5">
          {!selected ? (
            <p className="text-sm text-ink-3 py-16 text-center">Pilih karyawan di sebelah kiri untuk mengatur jatah cutinya.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-black text-ink">{selected.name || selected.email}</h3>
                <p className="text-[12px] text-ink-3">Jatah tahun {year}. Kosongkan kolom jatah untuk memakai nilai bawaan.</p>
              </div>
              {loadingEditor ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-ink-3" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-ink-3 text-left">
                        <th className="py-2 pr-3">Jenis</th>
                        <th className="py-2 px-2 text-right">Jatah (hari)</th>
                        <th className="py-2 px-2 text-right">Terpakai</th>
                        <th className="py-2 px-2 text-right">Menunggu</th>
                        <th className="py-2 pl-2 text-right">Sisa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balances.map((b) => (
                        <tr key={b.type} className="border-t border-line-2">
                          <td className="py-2 pr-3 font-semibold text-ink">{b.type}</td>
                          <td className="py-2 px-2 text-right">
                            <input
                              inputMode="decimal"
                              aria-label={`Jatah ${b.type}`}
                              value={inputs[b.type] ?? ""}
                              placeholder={b.explicit ? "" : b.quota === null ? "Tak terbatas" : `${b.quota} (bawaan)`}
                              onChange={(e) => setInputs((p) => ({ ...p, [b.type]: e.target.value }))}
                              className={inputCls}
                            />
                          </td>
                          <td className="py-2 px-2 text-right text-ink-2">{b.used}</td>
                          <td className="py-2 px-2 text-right text-ink-2">{b.pending}</td>
                          <td className="py-2 pl-2 text-right font-bold text-ink">{b.remaining === null ? "∞" : b.remaining}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {message && <p role="status" className={`text-xs font-medium ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
              <div className="flex justify-end">
                <button type="button" onClick={save} disabled={saving || loadingEditor} className="btn btn-primary btn-sm disabled:opacity-60 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} Simpan Jatah
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
