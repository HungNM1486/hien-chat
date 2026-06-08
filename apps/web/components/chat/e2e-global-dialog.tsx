"use client";

import { useE2EStore } from "@/stores/e2e-store";
import { E2ESetupDialog } from "@/components/chat/e2e-setup-dialog";

export function E2EGlobalDialog() {
  const pending = useE2EStore((s) => s.pendingRequest);
  if (!pending) return null;
  return <E2ESetupDialog conversation={undefined} />;
}
