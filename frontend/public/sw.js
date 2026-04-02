const CACHE_NAME = "construction-app-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls — network only (no cache)
  if (url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ success: false, message: "Offline — network nahi hai" }), {
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Static assets — cache first
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});

// Offline attendance queue
const ATTENDANCE_QUEUE_KEY = "offline-attendance-queue";

self.addEventListener("message", (event) => {
  if (event.data?.type === "QUEUE_ATTENDANCE") {
    // Store offline attendance for later sync
    const record = event.data.payload;
    self.registration.sync?.register("sync-attendance");
  }
});

// Background sync for attendance
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-attendance") {
    event.waitUntil(syncOfflineAttendance());
  }
});

const syncOfflineAttendance = async () => {
  // IndexedDB se pending records nikalo aur backend pe bhejo
  console.log("Background sync: attendance records syncing...");
};
