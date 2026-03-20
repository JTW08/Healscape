// HealScape Service Worker
// Strategy: network-first for HTML, cache-first for assets
// CACHE_VERSION is injected at deploy time by deploy.sh — do not edit manually.
// Format: healscape-YYYYMMDD-HHMMSS  (UTC, set by the build script)

const CACHE_VERSION = 'healscape-BUILD_TIMESTAMP';
const CACHE_STATIC  = CACHE_VERSION + '-static';

// Works on both GitHub Pages (/Healscape/) and custom domains (/)
const BASE = self.registration.scope;

const STATIC_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'assets/icon-192.png',
  BASE + 'assets/icon-512.png',
];

// ── Install ───────────────────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(function(cache) {
      // addAll fails if any resource fails — use individual puts so one
      // missing icon doesn't block the whole install
      return Promise.all(
        STATIC_ASSETS.map(function(url) {
          return fetch(url).then(function(res) {
            if (res.ok) return cache.put(url, res);
          }).catch(function() {}); // ignore individual failures
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activate ──────────────────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_STATIC; })
          .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var req = event.request;

  // Only intercept GET requests to our own origin
  if (req.method !== 'GET') return;
  var reqUrl = new URL(req.url);
  if (reqUrl.origin !== self.location.origin) return;

  // HTML: network-first so deploys always update
  if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(req).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_STATIC).then(function(c) { c.put(req, clone); });
        return res;
      }).catch(function() {
        return caches.match(req).then(function(cached) {
          return cached || caches.match(BASE + 'index.html');
        });
      })
    );
    return;
  }

  // Assets: cache-first with network fallback
  event.respondWith(
    caches.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(res) {
        if (res.ok) {
          var clone = res.clone();
          caches.open(CACHE_STATIC).then(function(c) { c.put(req, clone); });
        }
        return res;
      }).catch(function() {
        return new Response('Not found', { status: 404 });
      });
    })
  );
});

// ── Notification click — open/focus the app ───────────────────────
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If app is already open, focus it
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf('/Healscape') !== -1 || client.url.indexOf(self.location.origin) !== -1) {
          return client.focus();
        }
      }
      // Otherwise open it
      return clients.openWindow(self.registration.scope);
    })
  );
});
