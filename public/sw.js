// FaceLeb Service Worker — cache-first for assets, network-first for navigation
const CACHE_VERSION = "v2";
const STATIC_CACHE = `fl-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `fl-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  "/",
  "/offline.html",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png",
];

// ── Install ─────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache Supabase API — let React Query handle it
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("supabase.in") ||
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/storage/")
  ) {
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|png|svg|ico|jpg|jpeg|webp|gif|avif)(\?.*)?$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation (HTML pages): network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ── Strategy helpers ──────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503, statusText: "Service Unavailable" });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response("", { status: 503 });
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    // Never serve a cached page for a different URL — always use the offline page
    const offline = await caches.match(OFFLINE_URL);
    return (
      offline ??
      new Response("<h1>You are offline</h1>", {
        headers: { "Content-Type": "text/html" },
      })
    );
  }
}

// ── Skip-waiting message from app ─────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const {
    title = "FaceLeb",
    body = "You have a new notification",
    icon = "/icons/icon-192.png",
    badge = "/icons/icon-96.png",
    url = "/",
  } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      data: { url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    }),
  );
});

// ── Background sync (queue failed mutations) ──────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-posts") {
    event.waitUntil(syncPendingPosts());
  }
});

async function syncPendingPosts() {
  // Intentionally minimal — actual queuing logic lives in the app
  const clients_ = await clients.matchAll({ type: "window" });
  for (const client of clients_) {
    client.postMessage({ type: "BG_SYNC_READY" });
  }
}
