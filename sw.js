const CACHE_NAME = 'pokeclicker-v16';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/game.js',
  '/js/pokemon.js',
  '/js/player.js',
  '/js/combat.js',
  '/js/routes.js',
  '/js/gym.js',
  '/js/shop.js',
  '/js/events.js',
  '/js/abilities.js',
  '/js/juice.js',
  '/js/audio.js',
  '/js/ui.js',
  '/js/save.js',
  '/js/expeditions.js',
  '/js/eggs.js',
  '/js/sprites.js',
  '/js/backgrounds.js',
  '/data/pokemon.json',
  '/assets/ui/stat-pokedex.svg',
  '/assets/ui/stat-kills.svg',
  '/assets/ui/stat-captures.svg',
  '/assets/ui/sound-on.svg',
  '/assets/ui/sound-off.svg',
  '/assets/ui/crit-hit.svg',
  '/assets/ui/eff-effective.svg',
  '/assets/ui/eff-immune.svg',
  '/assets/ui/eff-resist.svg',
  '/assets/ui/eff-super.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle http/https requests (skip chrome-extension://, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Cache sprites from GitHub (cache-first — they never change)
  if (url.hostname === 'raw.githubusercontent.com' && url.pathname.includes('sprites')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      ).catch(() => fetch(event.request))
    );
    return;
  }

  // Cache music MP3s (cache-first — large files that don't change)
  if (url.pathname.startsWith('/music/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.ok && response.status !== 206) cache.put(event.request, response.clone());
            return response;
          });
        })
      ).catch(() => fetch(event.request))
    );
    return;
  }

  // Network-first for app assets — always get fresh files, fallback to cache offline
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update cache with fresh response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
