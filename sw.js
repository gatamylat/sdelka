// Service Worker — стратегия network-first (урок: SW не должен держать старый код)
// При каждом обновлении приложения МЕНЯЙТЕ версию ниже → старый кеш очистится.
const CACHE = 'sdelka-v4';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Не трогаем Firebase / Google / шрифты — всегда из сети
  if (req.url.includes('firebase') || req.url.includes('gstatic') ||
      req.url.includes('googleapis') || req.method !== 'GET') {
    return;
  }
  // Network-first: пробуем сеть, при сбое отдаём из кеша
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
