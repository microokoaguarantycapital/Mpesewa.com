// M-Pesewa Service Worker
const CACHE_NAME = 'm-pesewa-v1.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/css/components.css',
  '/assets/css/animations.css',
  '/assets/css/dashboard.css',
  '/assets/css/forms.css',
  '/assets/css/tables.css',
  '/assets/js/app.js',
  '/assets/js/auth.js',
  '/assets/js/calculator.js',
  '/assets/js/pwa.js',
  '/assets/js/utils.js',
  '/assets/images/logo.svg',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@700;800;900&display=swap'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If offline and request is for an HTML page, return the offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Handle background sync for offline forms
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from M-Pesewa',
    icon: '/assets/images/icons/icon-192x192.png',
    badge: '/assets/images/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: event.data ? event.data.url() : '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('M-Pesewa', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return clients.openWindow(event.notification.data.url || '/');
      })
  );
});

// Sync forms function (to be implemented with actual form sync logic)
function syncForms() {
  // This function would sync any forms submitted while offline
  // For now, it's a placeholder that returns a resolved promise
  return Promise.resolve();
}

// Periodic sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicSync', (event) => {
    if (event.tag === 'update-content') {
      event.waitUntil(updateContent());
    }
  });
}

function updateContent() {
  // Update cached content periodically
  return caches.open(CACHE_NAME)
    .then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    });
}