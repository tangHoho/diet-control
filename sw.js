// 離線快取：把頁面本身存起來，之後沒網路也能開。
// 每次更新 index.html 時把 VERSION 加 1，手機重新開啟就會拿到新版。
const VERSION = 'v2';
const CACHE = 'meal-app-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Apps Script / AI 的請求一律走網路，不快取
  if (url.origin !== location.origin) return;
  // 頁面本身：有網路就抓新的並更新快取，沒網路就用快取
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
