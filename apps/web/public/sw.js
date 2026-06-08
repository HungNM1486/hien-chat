// Self-destruct: gỡ Service Worker và xóa cache cũ (gây lỗi navigation Next.js).
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then((clients) => {
        for (const client of clients) {
          client.navigate(client.url);
        }
      }),
  );
});

// Không chặn bất kỳ request nào.
self.addEventListener("fetch", () => {});
