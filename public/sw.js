// Service Worker para Comunidad Feeling PWA
const CACHE_NAME = 'feeling-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Estrategia Network first con fallback a cache si fuera necesario
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
