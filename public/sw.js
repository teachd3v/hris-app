// Versi service worker (naik setiap perubahan perilaku push); ditampilkan di Diagnostik halaman Notifikasi.
const SW_VERSION = 'push-2';
const DIAG_CACHE = 'push-diag';

// Catatan diagnostik untuk halaman Notifikasi: kapan push terakhir DITERIMA service worker dan apakah notifikasinya tampil.
// Dibaca halaman lewat Cache API (satu origin). Tidak berisi isi pesan.
async function putDiag(key, value) {
  try {
    const c = await caches.open(DIAG_CACHE);
    await c.put(key, new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } }));
  } catch (err) {}
}

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(Promise.all([self.clients.claim(), putDiag('/__sw_version', SW_VERSION)]));
});

self.addEventListener('fetch', (e) => {
  // Minimal fetch handler required for PWA
  e.respondWith(fetch(e.request).catch(() => new Response("Offline")));
});

// Web Push: tampilkan notifikasi sistem walau aplikasi sedang tertutup.
// Setiap push WAJIB menampilkan notifikasi (syarat userVisibleOnly, terutama di iOS).
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { body: event.data ? event.data.text() : '' };
  }
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: { href: data.href || '/employee/notifikasi' },
  };
  if (data.tag) {
    options.tag = data.tag;
    options.renotify = true;
  }
  event.waitUntil((async () => {
    const entry = { at: Date.now(), shown: false, version: SW_VERSION };
    try {
      await self.registration.showNotification(data.title || 'Teach HRIS', options);
      entry.shown = true;
    } catch (err) {
      entry.error = String((err && err.message) || err);
    }
    await putDiag('/__push_last', entry);
  })());
});

// Ketuk notifikasi: fokuskan jendela aplikasi yang sudah terbuka (lalu arahkan ke halaman terkait), atau buka yang baru.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.href) || '/employee/notifikasi';
  let url = new URL('/employee/notifikasi', self.location.origin).href;
  try {
    const u = new URL(raw, self.location.origin);
    if (u.origin === self.location.origin) url = u.href; // hanya halaman di aplikasi ini
  } catch (err) {}
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      if (c.url.startsWith(self.location.origin) && 'focus' in c) {
        await c.focus();
        if ('navigate' in c) {
          try { await c.navigate(url); } catch (err) {}
        }
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
