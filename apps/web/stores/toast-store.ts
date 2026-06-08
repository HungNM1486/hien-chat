"use client";

import { create } from "zustand";

export type ToastType = "info" | "success" | "error";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  show: (
    message: string,
    type?: ToastType,
    action?: Toast["action"],
  ) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (message, type = "info", action) => {
    const id = crypto.randomUUID();
    set({ toasts: [...get().toasts, { id, message, type, action }] });
    setTimeout(() => get().dismiss(id), action ? 8000 : 4000);
  },

  dismiss: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function toast(
  message: string,
  type?: ToastType,
  action?: Toast["action"],
) {
  useToastStore.getState().show(message, type, action);
}
