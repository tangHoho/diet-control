// 離線快取。每次更新任何檔案，把 VERSION 加 1，手機重開就會拿到新版。
const VERSION = 'v21';
const CACHE = 'dailycontrol-' + VERSION;
const ASSETS = [
  './', './index.html', './config.js', './manifest.webmanifest?v=7',
  './css/app.css?v=21',
  './js/firebase.js?v=21', './js/data.js?v=21', './js/state.js?v=21', './js/onboard.js?v=21',
  './js/calc.js?v=21', './js/library.js?v=21', './js/log.js?v=21', './js/auth.js?v=21', './js/app.js?v=21',
  './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // Firebase / Apps Script 一律走網路
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
