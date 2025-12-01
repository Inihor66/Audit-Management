self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("audit-cache").then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/index.css",
        "/index.tsx",
        "/manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request);
    })
  );
});
