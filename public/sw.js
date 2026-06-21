/* Service worker — app-shell caching for a live dashboard.
   Strategy:
   - /api/* and cross-origin: network-only (never cache live data).
   - navigations: network-first, fall back to cache, then /offline.
   - other same-origin GET (static assets, /_next/*): cache-first, fill cache as used.
   Bump CACHE to invalidate old caches on deploy. */
const CACHE = 'ems-shell-v1'
const PRECACHE = ['/offline', '/icons/icon-192.png', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // cross-origin: let the network handle it
  if (url.pathname.startsWith('/api/')) return // live data: network-only

  // Navigations: network-first → cache → offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((cached) => cached || caches.match('/offline')))
    )
    return
  }

  // Static assets: cache-first, then network (and cache the result).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached)
    })
  )
})
