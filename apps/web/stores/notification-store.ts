"use client";

import { create } from "zustand";

export interface NotificationPrefs {
  inAppToast: boolean;
  messageSound: boolean;
  callRing: boolean;
  pushEnabled: boolean;
  desktopNotify: boolean;
}

const STORAGE_KEY = "hien-nha-notification-prefs";

const defaults: NotificationPrefs = {
  inAppToast: true,
  messageSound: true,
  callRing: true,
  pushEnabled: true,
  desktopNotify: true,
};

function loadPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

function savePrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

interface NotificationState extends NotificationPrefs {
  pushPermission: NotificationPermission | "unsupported";
  pushSubscribed: boolean;
  setPref: <K extends keyof NotificationPrefs>(
    key: K,
    value: NotificationPrefs[K],
  ) => void;
  setPushPermission: (permission: NotificationPermission | "unsupported") => void;
  setPushSubscribed: (subscribed: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...loadPrefs(),
  pushPermission:
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  pushSubscribed: false,

  setPref: (key, value) => {
    const next = { ...get(), [key]: value };
    savePrefs({
      inAppToast: next.inAppToast,
      messageSound: next.messageSound,
      callRing: next.callRing,
      pushEnabled: next.pushEnabled,
      desktopNotify: next.desktopNotify,
    });
    set({ [key]: value });
  },

  setPushPermission: (permission) => set({ pushPermission: permission }),
  setPushSubscribed: (subscribed) => set({ pushSubscribed: subscribed }),
}));
