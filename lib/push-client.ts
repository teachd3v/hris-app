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
