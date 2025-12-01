const CACHE_NAME = 'hybrid-sa-n31-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Leaflet assets from CDN
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install event – pre-cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.log('Cache addAll error:', err);
      });
    })
  );
});

// Activate event – clean old caches if any
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// Fetch event – cache-first strategy with network fallback
self.addEventListener('fetch', event => {
  const request = event.request;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            try {
              cache.put(request, networkResponse.clone());
            } catch (e) {
              // mund të ketë kufizime CORS për disa burime
              console.log('Cache put error:', e);
            }
            return networkResponse;
          });
        })
        .catch(() => {
          return cachedResponse || new Response(
            'Offline – this resource is not cached yet.',
            { status: 503, statusText: 'Service Unavailable' }
          );
        });
    })
  );
});

