"use client";

import { create } from "zustand";
import type { UserPublic } from "@hien-nha/shared";
import * as authApi from "@/lib/auth-api";

interface AuthState {
  user: UserPublic | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: UserPublic | null) => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),

  initialize: async () => {
    set({ isLoading: true });
    const user = await authApi.initSession();
    set({ user, isLoading: false, isInitialized: true });
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null });
  },
}));
