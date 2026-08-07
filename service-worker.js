const CACHE_NAME = "codice-web-v0.1.37-rhythm-legend";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./app-config.js",
  "./app-update.js",
  "./manifest.webmanifest",
  "./vendor/supabase.js",
  "./assets/icons/favicon.svg",
  "./assets/icons/favicon-32.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

const NETWORK_FIRST_FILES = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/app-config.js",
  "/app-update.js",
  "/manifest.webmanifest",
  "/updates/latest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  if (isNetworkFirstPath(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request, fallbackUrl = "") {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response?.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return (await cache.match(request)) || (fallbackUrl ? cache.match(fallbackUrl) : undefined) || Response.error();
  }
}

function isNetworkFirstPath(pathname) {
  return NETWORK_FIRST_FILES.some((file) => pathname === file || pathname.endsWith(file));
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fresh = fetch(request)
    .then((response) => {
      if (response?.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || fresh || Response.error();
}
