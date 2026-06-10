"use client";

import { useEffect } from "react";
import { hasSession } from "@hien-nha/crypto";
import { useAuthStore } from "@/stores/auth-store";
import { fetchPendingE2E } from "@/lib/e2e-api";
import { useE2EStore } from "@/stores/e2e-store";

export function CryptoInitProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((s) => s.user?.id);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized || !userId) return;
    void fetchPendingE2E()
      .then(async (pending) => {
        if (!pending) return;
        const unlocked = await hasSession(pending.conversationId);
        if (!unlocked) {
          useE2EStore.getState().setPendingRequest(pending);
        }
      })
      .catch(() => {
        // Unlock prompts also arrive through WebSocket.
      });
  }, [userId, isInitialized]);

  return <>{children}</>;
}
