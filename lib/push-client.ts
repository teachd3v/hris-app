"use client";

import { removePushSubscription, savePushSubscription } from "@/app/employee/notifikasi/push-actions";

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/**
 * Samakan pemilik langganan di server dengan akun yang sedang login. Langganan melekat pada browser, bukan akun,
 * jadi bila HP dipakai bergantian beberapa akun, notifikasi harus mengikuti akun yang login sekarang.
 */
export async function syncPushSubscription(): Promise<void> {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const sub = await currentSubscription();
    if (!sub) return;
    const json = sub.toJSON();
    await savePushSubscription({ endpoint: json.endpoint ?? "", keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } }, navigator.userAgent);
  } catch {
    // sinkronisasi gagal tidak boleh mengganggu halaman
  }
}

/**
 * Dipanggil sebelum logout: lepaskan perangkat ini dari akun yang keluar supaya notifikasinya tidak
 * muncul di HP yang kini dipakai orang lain. Langganan browser dibiarkan; akun berikutnya otomatis memasangnya lagi.
 * Dibatasi 2 detik agar logout tidak pernah tertahan.
 */
export async function detachPushBeforeLogout(): Promise<void> {
  const job = (async () => {
    const sub = await currentSubscription();
    if (sub) await removePushSubscription(sub.endpoint);
  })().catch(() => {});
  await Promise.race([job, new Promise<void>((r) => setTimeout(r, 2000))]);
}

export interface PushDiagnostics {
  permission: string;
  installed: boolean;
  swVersion: string | null;
  endpointHost: string | null;
  /** Push terakhir yang DITERIMA service worker di perangkat ini */
  last: { at: number; shown: boolean; error?: string; version?: string } | null;
}

async function readCacheJson<T>(key: string): Promise<T | null> {
  try {
    const c = await caches.open("push-diag");
    const r = await c.match(key);
    return r ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Keadaan push di perangkat ini, untuk memisahkan "tidak sampai ke HP" dari "sampai tapi tidak tampil". */
export async function readPushDiagnostics(): Promise<PushDiagnostics> {
  const sub = await currentSubscription().catch(() => null);
  let host: string | null = null;
  try { host = sub ? new URL(sub.endpoint).hostname : null; } catch { /* abaikan */ }
  return {
    permission: "Notification" in window ? Notification.permission : "tidak didukung",
    installed: window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as unknown as { standalone?: boolean }).standalone),
    swVersion: await readCacheJson<string>("/__sw_version"),
    endpointHost: host,
    last: await readCacheJson<PushDiagnostics["last"]>("/__push_last"),
  };
}
