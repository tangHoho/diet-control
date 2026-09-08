// 離線快取。版本號統一在 js/version.js 管理。
importScripts('./js/version.js');
const VERSION = 'v' + APP_VERSION;
const CACHE = 'dailycontrol-' + VERSION;
const Q = '?v=' + APP_VERSION;
const ASSETS = [
  './', './index.html', './js/version.js', './manifest.webmanifest',
  './config.js' + Q, './css/app.css' + Q,
  './js/firebase.js' + Q, './js/data.js' + Q, './js/state.js' + Q, './js/onboard.js' + Q,
  './js/calc.js' + Q, './js/library.js' + Q, './js/log.js' + Q, './js/auth.js' + Q, './js/app.js' + Q,
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
