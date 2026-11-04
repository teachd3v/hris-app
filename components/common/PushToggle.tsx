"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, Loader2, Smartphone } from "lucide-react";
import { getPushConfig, removePushSubscription, savePushSubscription, sendTestPush } from "@/app/employee/notifikasi/push-actions";
import { b64uToBytes } from "@/lib/web-push";
import { readPushDiagnostics, syncPushSubscription, type PushDiagnostics } from "@/lib/push-client";

type Phase = "checking" | "hidden" | "needs-install" | "denied" | "off" | "on";

const DISMISS_KEY = "push_prompt_dismissed_at";
const DISMISS_MS = 7 * 86_400_000;

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as unknown as { standalone?: boolean }).standalone);

function dismissedRecently(): boolean {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(t) && Date.now() - t < DISMISS_MS;
  } catch {
    return false;
  }
}

/**
 * Notifikasi HP (Web Push). `card` = ajakan di beranda (tersembunyi bila sudah aktif/ditolak/disembunyikan);
 * `row` = pengaturan lengkap di halaman Notifikasi (aktifkan, nonaktifkan, kirim uji).
 * Izin hanya bisa diminta lewat ketukan pengguna, jadi tidak pernah muncul otomatis saat memasang aplikasi.
 */
export default function PushToggle({ variant }: { variant: "card" | "row" }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [diag, setDiag] = useState<PushDiagnostics | null>(null);
  const refreshDiag = useCallback(() => { readPushDiagnostics().then(setDiag).catch(() => {}); }, []);

  const detect = useCallback(async () => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) {
      // iPhone hanya mendukung push untuk aplikasi yang dipasang ke layar utama
      setPhase(isIos() && !isStandalone() ? "needs-install" : "hidden");
      return;
    }
    const cfg = await getPushConfig().catch(() => ({ enabled: false, publicKey: null }));
    if (!cfg.enabled) return setPhase("hidden");
    if (Notification.permission === "denied") return setPhase("denied");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    const active = Notification.permission === "granted" && Boolean(sub);
    setPhase(active ? "on" : "off");
    // Perangkat bisa dipakai bergantian beberapa akun: pastikan langganan tercatat atas akun yang sedang login
    if (active) await syncPushSubscription();
  }, []);

  useEffect(() => { detect().catch(() => setPhase("hidden")); }, [detect]);
  useEffect(() => { if (variant === "row") refreshDiag(); }, [variant, refreshDiag, phase]);

  const enable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const cfg = await getPushConfig();
      if (!cfg.enabled || !cfg.publicKey) return setMessage({ ok: false, text: "Notifikasi HP belum diaktifkan di server." });
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPhase(permission === "denied" ? "denied" : "off");
        return setMessage({ ok: false, text: "Izin notifikasi tidak diberikan." });
      }
      const reg = await navigator.serviceWorker.ready;
      const key = b64uToBytes(cfg.publicKey) as unknown as BufferSource;
      let sub: PushSubscription;
      try {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      } catch {
        // Langganan lama memakai kunci server yang berbeda: lepas lalu coba lagi
        await (await reg.pushManager.getSubscription())?.unsubscribe();
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      }
      const json = sub.toJSON();
      const res = await savePushSubscription({ endpoint: json.endpoint ?? "", keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } }, navigator.userAgent);
      if (res.error) {
        await sub.unsubscribe().catch(() => {});
        return setMessage({ ok: false, text: res.error });
      }
      setPhase("on");
      setMessage({ ok: true, text: "Notifikasi HP aktif di perangkat ini." });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Gagal mengaktifkan notifikasi." });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setPhase("off");
      setMessage({ ok: true, text: "Notifikasi HP dimatikan di perangkat ini." });
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await sendTestPush();
      setMessage(res.error ? { ok: false, text: res.error } : { ok: true, text: `Notifikasi uji dikirim ke layanan push untuk ${res.sent} perangkat. Bila tidak muncul dalam beberapa detik, lihat Diagnostik di bawah.` });
      // Beri waktu push sampai ke perangkat, lalu perbarui catatan penerimaan
      setTimeout(refreshDiag, 3000);
      setTimeout(refreshDiag, 8000);
    } catch {
      setMessage({ ok: false, text: "Gagal mengirim notifikasi uji." });
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* abaikan */ }
    setPhase("hidden");
  };

  if (phase === "checking" || phase === "hidden") return null;

  if (variant === "card") {
    if (phase === "denied" || phase === "on" || dismissedRecently()) return null;
    return (
      <div data-testid="push-card" className="bg-white rounded-[24px] border border-[var(--line)] p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">{phase === "needs-install" ? <Smartphone size={20} /> : <BellRing size={20} />}</div>
          <div className="min-w-0">
            <div className="text-[14px] font-black text-ink">{phase === "needs-install" ? "Pasang aplikasi untuk menerima notifikasi" : "Aktifkan notifikasi"}</div>
            <p className="text-[12px] text-ink-3 leading-relaxed mt-0.5">
              {phase === "needs-install"
                ? "Di iPhone, buka lewat Safari, ketuk tombol Bagikan, lalu pilih Tambahkan ke Layar Utama. Buka aplikasi dari ikon itu untuk mengaktifkan notifikasi."
                : "Dapatkan pemberitahuan pengajuan dan persetujuan cuti langsung di HP, tanpa membuka aplikasi."}
            </p>
          </div>
        </div>
        {message && <p role="status" className={`text-[12px] font-medium ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={dismiss} className="flex-1 h-11 rounded-full bg-gray-100 border border-black/10 text-[13px] font-bold text-ink-2">Nanti saja</button>
          {phase !== "needs-install" && (
            <button type="button" onClick={enable} disabled={busy} className="flex-1 h-11 rounded-full bg-[var(--red)] text-white text-[13px] font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : "Aktifkan"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="push-row" className="bg-white rounded-[20px] border border-[var(--line)] p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-black text-ink">Notifikasi di HP</div>
          <div className="text-[11px] text-ink-3 leading-snug">
            {phase === "on" && "Aktif di perangkat ini."}
            {phase === "off" && "Belum aktif di perangkat ini."}
            {phase === "denied" && "Diblokir. Aktifkan izin notifikasi untuk situs ini di pengaturan browser atau HP, lalu muat ulang halaman."}
            {phase === "needs-install" && "Di iPhone, pasang dulu aplikasi ke Layar Utama (Safari → Bagikan → Tambahkan ke Layar Utama)."}
          </div>
        </div>
        {phase === "off" && <button type="button" onClick={enable} disabled={busy} className="h-10 px-4 rounded-full bg-[var(--red)] text-white text-[12px] font-bold disabled:opacity-60 shrink-0">{busy ? <Loader2 size={14} className="animate-spin" /> : "Aktifkan"}</button>}
        {phase === "on" && <button type="button" onClick={disable} disabled={busy} className="h-10 px-4 rounded-full bg-gray-100 border border-black/10 text-ink-2 text-[12px] font-bold disabled:opacity-60 shrink-0">Matikan</button>}
      </div>
      {phase === "on" && (
        <button type="button" onClick={test} disabled={busy} className="self-start text-[12px] font-bold text-[var(--red)] disabled:opacity-60">Kirim notifikasi uji</button>
      )}
      {message && <p role="status" className={`text-[12px] font-medium ${message.ok ? "text-green-600" : "text-red-600"}`}>{message.text}</p>}
      {diag && (
        <details data-testid="push-diagnostics" className="text-[11px] text-ink-3" onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) refreshDiag(); }}>
          <summary className="cursor-pointer font-bold text-ink-2">Diagnostik</summary>
          <ul className="mt-1.5 space-y-0.5 leading-snug">
            <li>Izin notifikasi: <b>{diag.permission}</b></li>
            <li>Mode: <b>{diag.installed ? "aplikasi terpasang" : "tab browser"}</b></li>
            <li>Service worker: <b>{diag.swVersion ?? "belum aktif"}</b></li>
            <li>Layanan push: <b>{diag.endpointHost ?? "belum berlangganan"}</b></li>
            <li>
              Push terakhir diterima perangkat:{" "}
              <b>
                {diag.last
                  ? `${new Date(diag.last.at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}, notifikasi ${diag.last.shown ? "tampil" : "GAGAL tampil"}${diag.last.error ? ` (${diag.last.error})` : ""}`
                  : "belum pernah"}
              </b>
            </li>
          </ul>
        </details>
      )}
    </div>
  );
}
