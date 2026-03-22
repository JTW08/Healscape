// HealScape Service Worker - build 20260322_0040
const CACHE_NAME = 'healscape-20260322_0040';
const ASSETS = ['/Healscape/','/Healscape/index.html','/Healscape/manifest.json',
  '/Healscape/icon-192.png','/Healscape/icon-512.png',
  '/Healscape/milo-actions.png','/Healscape/milo-eat-carrot.png',
  '/Healscape/milo-eat-strawberry.png','/Healscape/milo-eat-blueberry.png',
  '/Healscape/milo-play-volleyball.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE_NAME).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}))}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){var url=e.request.url;if(url.includes('firebase')||url.includes('googleapis')||url.includes('open-meteo')||url.includes('emailjs')||url.includes('anthropic')){e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request);}));return;}e.respondWith(caches.match(e.request).then(function(cached){return cached||fetch(e.request).then(function(r){if(r.ok){var cl=r.clone();caches.open(CACHE_NAME).then(function(c){c.put(e.request,cl);});}return r;});}));});
