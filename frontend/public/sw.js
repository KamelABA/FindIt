// FindIt service worker: makes the app installable and shows the cached shell when offline.
// Strict rule: nothing from /api/ and nothing from another origin is ever intercepted or cached,
// so item data always comes fresh from the server.
const CACHE = "findit-shell-v1";
const SHELL = ["/", "/manifest.json", "/logo.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

// drop caches left by older versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // left to the browser: every non-GET request, other origins, and every API route
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    return;
  }

  // page navigations: network first, cached shell when offline (nothing is written to the cache here)
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
  }
});
