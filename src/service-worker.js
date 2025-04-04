self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('pwa-cache').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './styles/tel_pwa.css',
        './js/ctd_pwa_consult.js',
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
