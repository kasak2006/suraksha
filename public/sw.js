/*
 * Suraksha service worker (spec §5.8, §10, §11).
 *
 * Goals:
 *  - App shell works offline after the first visit (the aeroplane-mode demo).
 *  - The neural model (~30 MB, fetched once from the HF CDN) is cached so the
 *    fused check keeps working with no data plan — "download the AI once, then
 *    it works offline forever".
 *  - Zero cost, no build step: a hand-written SW, registered by a client
 *    component. Bump CACHE_VERSION on every deploy to invalidate old caches.
 *
 * This file is served from /sw.js (public/), so its scope is the whole origin.
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `suraksha-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `suraksha-static-${CACHE_VERSION}`;
const MODEL_CACHE = `suraksha-model-${CACHE_VERSION}`;

// The three locale entry points. Enough to open the app cold with no network;
// deeper routes are cached as they are visited, and the matching locale home is
// the offline fallback for any uncached route.
const SHELL_URLS = ["/gu", "/hi", "/en"];

// Model + ML-runtime origins. Cache-first: these assets are immutable and huge,
// so we never want to re-download them once cached.
const MODEL_HOSTS = ["huggingface.co", "cdn.jsdelivr.net", "cdn-lfs.huggingface.co"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Best-effort: a single 404 must not abort the whole install.
      await Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, STATIC_CACHE, MODEL_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => !keep.has(n)).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

function isModelRequest(url) {
  return MODEL_HOSTS.includes(url.hostname);
}

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/models/") ||
      /\.(?:js|css|woff2?|svg|png|ico|webmanifest|json)$/.test(url.pathname))
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  // Cache successful and opaque (cross-origin CDN) responses alike.
  if (response && (response.ok || response.type === "opaque")) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || fetch(request);
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    // Keep the latest HTML for this route for future offline visits.
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    // Fall back to the same-locale home shell, then any cached locale home.
    const url = new URL(request.url);
    const locale = url.pathname.split("/")[1] || "gu";
    return (
      (await cache.match(`/${locale}`)) ||
      (await cache.match("/gu")) ||
      new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (isModelRequest(url)) {
    event.respondWith(cacheFirst(request, MODEL_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Everything else: network with a cache fallback, so nothing hard-fails offline.
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      return cached || new Response("", { status: 504 });
    }),
  );
});
