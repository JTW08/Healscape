// HealScape Service Worker
const CACHE_NAME = 'healscape-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  // Network-first for Firebase, cache-first for everything else
  if (e.request.url.includes('firebaseio.com') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('gstatic.com')) {
    e.respondWith(fetch(e.request).catch(function() {
      return caches.match(e.request);
    }));
    return;
  }
  e.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        var networkFetch = fetch(e.request).then(function(response) {
          if (response && response.status === 200 && e.request.method === 'GET') {
            cache.put(e.request, response.clone());
          }
          return response;
        });
        return cached || networkFetch;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(err) {}
  var title   = data.title || 'HealScape';
  var options = {
    body:    data.body || '',
    icon:    data.icon || '/Healscape/icon.png',
    badge:   '/Healscape/icon.png',
    data:    data,
    vibrate: [200, 100, 200],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(wins) {
      if (wins.length > 0) { wins[0].focus(); return; }
      return clients.openWindow('/Healscape/');
    })
  );
});
