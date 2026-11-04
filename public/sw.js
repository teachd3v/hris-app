self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
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
  event.waitUntil(self.registration.showNotification(data.title || 'Teach HRIS', options));
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
