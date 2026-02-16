const CACHE_NAME = 'opticode-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './themes.css',
  './animations.css',
  './enhanced-ui.css',
  './ui-upgrade.css',
  './opticode-v3.css',
  './app.js',
  './auth.js',
  './editor.js',
  './ai.js',
  './utils.js',
  './storage.js',
  './env.js',
  './icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
