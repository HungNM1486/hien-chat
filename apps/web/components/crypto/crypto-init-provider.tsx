"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { initUserCryptoKeys } from "@/lib/crypto-init";

export function CryptoInitProvider({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((s) => s.user?.id);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized || !userId) return;
    void initUserCryptoKeys().catch(() => {
      // IndexedDB / crypto unavailable
    });
  }, [userId, isInitialized]);

  return <>{children}</>;
}
