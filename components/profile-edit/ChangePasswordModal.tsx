"use client";

import { useState } from "react";
import { X } from "lucide-react";
import ModalPortal from "@/components/common/ModalPortal";
import { signOut } from "next-auth/react";
import { changeOwnPassword } from "@/app/employee/profile/password-actions";

export default function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next !== confirm) return setError("Konfirmasi password tidak sama");
    setLoading(true);
    try {
      const res = await changeOwnPassword(current, next);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setDone(true);
      setTimeout(() => signOut({ callbackUrl: "/" }), 1500);
    } catch {
      setError("Terjadi kesalahan, coba lagi");
      setLoading(false);
    }
  };

  const inputClass = "w-full h-11 px-3 rounded-xl border border-line-2 bg-white text-sm text-ink outline-none focus:border-[var(--red)]";

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-line-2 w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-ink">Ubah Password</h3>
          <button type="button" onClick={onClose} className="p-2 text-ink-3 hover:text-ink rounded-full"><X size={18} /></button>
        </div>
        {done ? (
          <p className="text-sm text-ink-2">Password berhasil diubah. Anda akan keluar dan perlu masuk kembali...</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input type="password" required autoComplete="current-password" placeholder="Password saat ini" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
            <input type="password" required autoComplete="new-password" placeholder="Password baru (min. 8 karakter, huruf & angka)" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
            <input type="password" required autoComplete="new-password" placeholder="Ulangi password baru" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
            {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Batal</button>
              <button type="submit" disabled={loading} className="btn btn-primary btn-sm">{loading ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
