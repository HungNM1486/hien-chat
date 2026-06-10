import { removeSession } from "@hien-nha/crypto";
import { useE2EStore } from "@/stores/e2e-store";

export function notifyE2ESessionChanged(conversationId: string) {
  window.dispatchEvent(
    new CustomEvent("hien:e2e-session-changed", {
      detail: { conversationId },
    }),
  );
}

export async function clearE2ESession(conversationId: string): Promise<void> {
  await removeSession(conversationId);

  const pending = useE2EStore.getState().pendingRequest;
  if (pending?.conversationId === conversationId) {
    useE2EStore.getState().setPendingRequest(null);
  }

  notifyE2ESessionChanged(conversationId);
}
