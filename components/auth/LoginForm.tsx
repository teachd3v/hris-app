"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res || res.error) {
      setError("Email atau password salah, atau akun terkunci sementara. Coba lagi beberapa menit lagi.");
      setLoading(false);
      return;
    }
    // Hard navigation agar routing berbasis role dievaluasi ulang di server
    window.location.href = "/";
  };

  const inputClass =
    "w-full h-[52px] px-4 rounded-[16px] border border-gray-200 bg-white text-gray-900 text-[15px] outline-none focus:border-[var(--red)]";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="email" required autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      <input type="password" required autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      {error && <p role="alert" className="text-[13px] font-medium text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-[56px] bg-[var(--red)] hover:opacity-90 disabled:opacity-60 text-white rounded-[20px] font-bold text-[15px] transition-all"
      >
        {loading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
