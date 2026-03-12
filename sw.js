/* =========================================================
   JobNexus Service Worker  —  sw.js
   Caching Strategy:
     • Cache-First  : CSS, JS, images, fonts
     • Network-First: HTML pages (always fresh content)
     • Offline page : shown when network + cache both fail
   ========================================================= */

const CACHE_NAME = 'jobnexus-v16';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/login.html',
  '/pages/browse-jobs.html',
  '/pages/about.html',
  '/pages/contact.html',
  '/pages/career-tips.html',
  '/pages/find-talent.html',
  '/pages/internships.html',
  '/pages/privacy-policy.html',
  '/pages/resources.html',
  '/pages/terms-of-service.html',
  '/css/styles.css',
  '/css/animations.css',
  '/css/dark-mode.css',
  '/css/advanced-features.css',
  '/css/premium-ui.css',
  '/css/light-theme.css',
  '/css/page-animations.css',
  '/css/responsive.css',
  '/js/main.js',
  '/js/pwa.js',
  '/js/firebase-config.js',
  '/js/page-animations.js',
  '/js/premium-ui-init.js',
  '/Public/icons/icon-192.svg',
  '/Public/icons/icon-512.svg',
  '/manifest.json'
];

// ── Install: pre-cache all critical assets ──────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to pre-cache:', err);
      });
    })
    // NOTE: No self.skipWaiting() here — new SW waits until user clicks "Update"
  );
});

// ── Message: allow page to trigger skipWaiting on demand ─
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Activate: delete stale caches ───────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch: serve cached or network ──────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (Firebase, CDN, etc.)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === 'navigate';
  const isStaticAsset = /\.(css|js|svg|png|jpg|jpeg|gif|webp|woff2?|ttf|ico)$/i.test(url.pathname);

  if (isStaticAsset) {
    // Cache-First for static assets
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => caches.match(OFFLINE_URL));
      })
    );
  } else if (isNavigation) {
    // Network-First for HTML navigation
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
    );
  }
});
