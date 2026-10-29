"use client";

import { useState } from "react";
import { X } from "lucide-react";
import ModalPortal from "@/components/common/ModalPortal";
import { createEmployee } from "@/app/admin/employees/actions";

export default function AddEmployeeModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Karyawan" | "Admin">("Karyawan");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  if (!open) return null;

  const close = () => {
    setName(""); setEmail(""); setRole("Karyawan"); setError(null); setCreated(null);
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await createEmployee({ name, email, role });
    setLoading(false);
    if (res.error) return setError(res.error);
    setCreated(email.trim().toLowerCase());
    onCreated();
  };

  const inputClass = "w-full h-11 px-3 rounded-xl border border-line-2 bg-white text-sm text-ink outline-none focus:border-[var(--red)]";

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-ink">Tambah Karyawan</h3>
          <button type="button" onClick={close} className="p-2 text-ink-3 hover:text-ink rounded-full"><X size={18} /></button>
        </div>
        {created ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-2">
              Akun <b>{created}</b> dibuat. Karyawan login dengan email tersebut dan password default, lalu diminta mengganti password dari menu Profil.
            </p>
            <div className="flex justify-end"><button type="button" onClick={close} className="btn btn-primary btn-sm">Selesai</button></div>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input required placeholder="Nama lengkap" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            <input required type="email" placeholder="Email (dipakai untuk login)" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <select value={role} onChange={(e) => setRole(e.target.value as "Karyawan" | "Admin")} className={inputClass}>
              <option value="Karyawan">Karyawan</option>
              <option value="Admin">Admin</option>
            </select>
            {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={close} className="btn btn-ghost btn-sm">Batal</button>
              <button type="submit" disabled={loading} className="btn btn-primary btn-sm">{loading ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
