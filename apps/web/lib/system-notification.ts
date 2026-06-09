export interface SystemNotificationOptions {
  title: string;
  body: string;
  tag: string;
  href: string;
  requireInteraction?: boolean;
}

export function showSystemNotification({
  title,
  body,
  tag,
  href,
  requireInteraction = false,
}: SystemNotificationOptions): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag,
    requireInteraction,
    data: { url: href },
  });

  notification.onclick = () => {
    window.focus();
    window.location.href = href;
    notification.close();
  };
}
