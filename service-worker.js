const CACHE_NAME = 'mpesewa-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/css/components.css',
  '/assets/css/animations.css',
  '/assets/css/dashboard.css',
  '/assets/css/forms.css',
  '/assets/css/tables.css',
  '/assets/js/app.js',
  '/assets/js/auth.js',
  '/assets/js/roles.js',
  '/assets/js/groups.js',
  '/assets/js/lending.js',
  '/assets/js/borrowing.js',
  '/assets/js/ledger.js',
  '/assets/js/blacklist.js',
  '/assets/js/subscriptions.js',
  '/assets/js/countries.js',
  '/assets/js/collectors.js',
  '/assets/js/calculator.js',
  '/assets/js/pwa.js',
  '/assets/js/utils.js',
  '/assets/images/logo.svg',
  '/pages/dashboard/borrower-dashboard.html',
  '/pages/dashboard/lender-dashboard.html',
  '/pages/dashboard/admin-dashboard.html',
  '/pages/lending.html',
  '/pages/borrowing.html',
  '/pages/ledger.html',
  '/pages/groups.html',
  '/pages/subscriptions.html',
  '/pages/blacklist.html',
  '/pages/debt-collectors.html',
  '/pages/about.html',
  '/pages/qa.html',
  '/pages/contact.html',
  '/data/countries.json',
  '/data/subscriptions.json',
  '/data/categories.json',
  '/data/collectors.json',
  '/data/demo-groups.json',
  '/data/demo-users.json',
  '/data/demo-ledgers.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});