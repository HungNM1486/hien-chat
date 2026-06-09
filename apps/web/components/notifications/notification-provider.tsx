"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  usePushNotifications();

  return (
    <>
      <ServiceWorkerRegister />
      {children}
    </>
  );
}
