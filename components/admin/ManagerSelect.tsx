"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Network } from "lucide-react";
import { setEmployeeManager } from "@/app/admin/employees/actions";

export default function ManagerSelect({
  employeeId,
  currentManagerId,
  isTopLeader,
  candidates,
}: {
  employeeId: string;
  currentManagerId: string | null;
  isTopLeader: boolean;
  candidates: { id: string; name: string; subtitle: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(currentManagerId ?? "");
  const [saved, setSaved] = useState(currentManagerId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await setEmployeeManager(employeeId, value || null);
      if (res.error) return setMessage({ ok: false, text: res.error });
      setSaved(value);
      setMessage({ ok: true, text: "Atasan langsung tersimpan" });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: "Terjadi kesalahan, coba lagi" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-center gap-3 md:w-56 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Network size={18} /></div>
        <div>
          <div className="text-sm font-black text-ink">Atasan Langsung</div>
          <div className="text-[11px] text-ink-3">Penyetuju pertama pengajuan cuti</div>
        </div>
      </div>

      {isTopLeader ? (
        <p className="text-sm font-semibold text-ink-2">Pucuk pimpinan — tidak memiliki atasan. Pengajuan cuti langsung ke HC.</p>
      ) : (
        <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:items-center">
          <select
            value={value}
            onChange={(e) => { setValue(e.target.value); setMessage(null); }}
            className="flex-1 h-11 px-3 rounded-xl border border-line-2 bg-white text-sm text-ink outline-none focus:border-[var(--red)]"
            aria-label="Atasan langsung"
          >
            <option value="">— Pilih atasan (wajib) —</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.subtitle ? ` — ${c.subtitle}` : ""}</option>
            ))}
          </select>
          <button type="button" onClick={save} disabled={saving || !value || value === saved} className="btn btn-primary btn-sm disabled:opacity-50 flex items-center gap-2 justify-center">
            {saving && <Loader2 size={14} className="animate-spin" />} Simpan
          </button>
        </div>
      )}
      {message && <p role="status" className={`text-xs font-medium ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
    </div>
  );
}
