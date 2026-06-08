const CACHE = "hien-nha-shell-v1";
const SHELL = ["/", "/chats", "/offline", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api") || url.hostname.includes("localhost:4000")) {
    return;
  }

  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          return caches.match("/offline");
        }
        return new Response("Offline", { status: 503 });
      }),
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "Hiên nhà", body: "Bạn có tin nhắn mới" };
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Hiên nhà", {
      body: data.body ?? "Bạn có tin nhắn mới",
      icon: "/icons/icon-192.png",
      data: { url: data.url ?? "/chats" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/chats";
  event.waitUntil(clients.openWindow(url));
});
