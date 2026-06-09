/* eslint-disable no-restricted-globals */
// Push-only service worker — không chặn fetch để tránh lỗi navigation Next.js.

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  const title = payload.title || "Hiên nhà";
  const body = payload.body || "";
  const url = payload.url || "/chats";
  const tag =
    payload.type === "call"
      ? `call-${payload.conversationId}`
      : `message-${payload.conversationId}`;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag,
      data: { url, type: payload.type, conversationId: payload.conversationId },
      requireInteraction: payload.type === "call",
      vibrate: payload.type === "call" ? [200, 100, 200, 100, 200] : [100],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/chats";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
