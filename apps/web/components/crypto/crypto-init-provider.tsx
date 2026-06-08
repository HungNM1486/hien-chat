"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { initUserCryptoKeys } from "@/lib/crypto-init";

export function CryptoInitProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (!isInitialized || !user) return;
    void initUserCryptoKeys().catch(() => {
      // IndexedDB / crypto unavailable
    });
  }, [user, isInitialized]);

  return <>{children}</>;
}
