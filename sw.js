const CACHE_NAME = 'informatix-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/lab/index.html',
  '/assets/css/style.css',
  '/assets/css/lab-core.css',
  '/assets/css/lab-components.css',
  '/assets/css/lab-editors.css',
  '/assets/js/script.js',
  '/assets/js/content.js',
  '/assets/js/lab.js',
  '/assets/js/theme-manager.js',
  '/assets/js/emoji-replacer.js',
  '/assets/js/lib/marked.min.js',
  '/assets/images/Informatix-logo.png',
  '/assets/images/lab-logo.png',
  '/assets/images/sadi-logo.jpeg',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API and external requests: network-only
  if (!url.origin.includes(location.host) && !url.origin.includes('localhost')) {
    return;
  }

  // Content files (.md): network-first, fallback to cache
  if (url.pathname.endsWith('.md')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets: cache-first
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('المحتوى غير متاح حالياً', { status: 503 });
  }
}
