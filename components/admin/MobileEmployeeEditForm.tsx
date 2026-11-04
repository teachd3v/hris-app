"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateEmployeeBasicInfo, type EmployeeBasicInput } from "@/app/admin/employees/actions";
import { DEPT_OPTIONS, LEVEL_OPTIONS, STATUS_OPTIONS } from "@/lib/employment-options";

const inputCls = "w-full h-12 px-3.5 rounded-2xl border border-line-2 bg-white text-[14px] text-ink outline-none focus:border-[var(--red)]";
const labelCls = "text-[11px] font-bold text-ink-3 uppercase tracking-wider";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

/** Pilihan baku; nilai lama yang tidak ada di daftar tetap ditampilkan agar tidak hilang diam-diam. */
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const extra = value && !options.some((o) => o.value === value) ? [{ value, label: `${value} (data lama)` }] : [];
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">— Belum diisi —</option>
      {[...extra, ...options].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function MobileEmployeeEditForm({ employeeId, initial }: { employeeId: string; initial: EmployeeBasicInput }) {
  const router = useRouter();
  const [v, setV] = useState<EmployeeBasicInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof EmployeeBasicInput) => (val: string) => setV((p) => ({ ...p, [k]: val }));
  const back = `/admin/m/karyawan/${employeeId}`;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await updateEmployeeBasicInfo(employeeId, v);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(back);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-white rounded-[20px] border border-[var(--line)] p-4 flex flex-col gap-4">
      <Field label="Nama"><input required maxLength={120} value={v.name} onChange={(e) => set("name")(e.target.value)} className={inputCls} /></Field>
      <Field label="No. Induk"><input maxLength={40} value={v.employee_code} onChange={(e) => set("employee_code")(e.target.value)} className={inputCls} /></Field>
      <Field label="Jabatan"><input maxLength={120} value={v.title} onChange={(e) => set("title")(e.target.value)} className={inputCls} /></Field>
      <Field label="Departemen"><Select value={v.dept} onChange={set("dept")} options={DEPT_OPTIONS} /></Field>
      <Field label="Level"><Select value={v.level} onChange={set("level")} options={LEVEL_OPTIONS} /></Field>
      <Field label="Status kepegawaian"><Select value={v.status} onChange={set("status")} options={STATUS_OPTIONS} /></Field>
      <Field label="Tanggal masuk"><input type="date" value={v.join_date} onChange={(e) => set("join_date")(e.target.value)} className={inputCls} /></Field>
      <Field label="Telepon"><input type="tel" inputMode="tel" maxLength={20} value={v.phone} onChange={(e) => set("phone")(e.target.value)} className={inputCls} /></Field>

      {error && <p role="alert" className="text-[12px] font-medium text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="button" disabled={saving} onClick={() => router.push(back)} className="flex-1 h-12 rounded-full border border-line-2 bg-white text-[14px] font-bold text-ink-2 disabled:opacity-50">Batal</button>
        <button type="submit" disabled={saving} className="flex-1 h-12 rounded-full bg-[var(--red)] text-white text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
        </button>
      </div>
      <p className="text-[11px] text-ink-3 leading-relaxed">Email, atasan, peran, dan status akun tidak diubah dari sini. Setiap perubahan dicatat di log audit.</p>
    </form>
  );
}
