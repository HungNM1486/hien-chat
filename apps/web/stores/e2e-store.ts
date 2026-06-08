"use client";

import { create } from "zustand";

interface E2ERequest {
  conversationId: string;
  requesterId: string;
  requesterName: string;
}

interface E2EState {
  pendingRequest: E2ERequest | null;
  setPendingRequest: (req: E2ERequest | null) => void;
}

export const useE2EStore = create<E2EState>((set) => ({
  pendingRequest: null,
  setPendingRequest: (pendingRequest) => set({ pendingRequest }),
}));
