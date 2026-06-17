// Service worker implementation for "Is that you?" — precache the full app
// shell so it works completely offline after the first load.
//
// This file is imported by the root /sw.js stub. The service worker must be
// registered from the root so its scope covers the whole app, but its logic
// lives here. Because the registered script is /sw.js, `self.location` is the
// site root, so the relative precache paths below resolve against the root.
//
// The cache name is keyed to the shared VERSION, so bumping version.js makes
// clients pick up a new build. (`../version.js` is relative to THIS file.)
import { VERSION } from '../version.js';

const CACHE_NAME = `is-that-you-v${VERSION}`;

const PRECACHE_URLS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'version.js',
  'sw.js',
  'pwa/service-worker.js',
  'pwa/manifest.webmanifest',
  'js/store.js',
  'js/i18n.js',
  'js/labels.js',
  'js/crypto.js',
  'js/ui.js',
  'js/a11y.js',
  'data/de/labels.json',
  'data/de/words.json',
  'data/en/labels.json',
  'data/en/words.json',
  'assets/logo.png',
  'assets/favicon-192.png',
  'assets/icon-192.png',
  'assets/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
          .then((cache) => cache.addAll(PRECACHE_URLS))
          .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
          .then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
          ))
          .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      });
    }),
  );
});
