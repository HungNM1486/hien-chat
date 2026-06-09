"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import {
  removePushSubscription,
  syncPushSubscription,
} from "@/lib/push-api";

export function usePushNotifications(): void {
  const userId = useAuthStore((s) => s.user?.id);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const pushEnabled = useNotificationStore((s) => s.pushEnabled);
  const setPushPermission = useNotificationStore((s) => s.setPushPermission);
  const setPushSubscribed = useNotificationStore((s) => s.setPushSubscribed);

  useEffect(() => {
    if (!isInitialized || !userId) return;

    if (!("Notification" in window)) {
      setPushPermission("unsupported");
      return;
    }

    setPushPermission(Notification.permission);

    if (!pushEnabled) {
      void removePushSubscription().finally(() => setPushSubscribed(false));
      return;
    }

    if (Notification.permission !== "granted") {
      setPushSubscribed(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const ok = await syncPushSubscription();
        if (!cancelled) {
          setPushSubscribed(ok);
          setPushPermission(Notification.permission);
        }
      } catch {
        if (!cancelled) setPushSubscribed(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    userId,
    isInitialized,
    pushEnabled,
    setPushPermission,
    setPushSubscribed,
  ]);
}
