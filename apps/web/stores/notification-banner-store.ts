"use client";

import { create } from "zustand";

export type BannerKind = "message" | "call";

export interface NotificationBanner {
  id: string;
  kind: BannerKind;
  title: string;
  body: string;
  href: string;
}

interface BannerState {
  banner: NotificationBanner | null;
  show: (banner: Omit<NotificationBanner, "id">) => void;
  dismiss: () => void;
}

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export const useNotificationBannerStore = create<BannerState>((set, get) => ({
  banner: null,

  show: (banner) => {
    if (dismissTimer) clearTimeout(dismissTimer);
    const id = crypto.randomUUID();
    set({ banner: { ...banner, id } });
    dismissTimer = setTimeout(() => {
      if (get().banner?.id === id) set({ banner: null });
    }, banner.kind === "call" ? 30000 : 8000);
  },

  dismiss: () => {
    if (dismissTimer) clearTimeout(dismissTimer);
    set({ banner: null });
  },
}));
