"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (isInitialized && !isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, isInitialized, router]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-text-secondary">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
