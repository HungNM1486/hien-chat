import type { PendingE2ERequest, PreKeyBundleInput } from "@hien-nha/shared";
import type { PreKeyBundlePublic } from "@hien-nha/crypto";
import { apiFetch } from "./api-client";

export async function uploadPreKeyBundle(
  bundle: PreKeyBundleInput,
): Promise<void> {
  await apiFetch("/keys/upload", {
    method: "POST",
    body: JSON.stringify(bundle),
  });
}

export async function fetchPreKeyBundle(
  userId: string,
): Promise<PreKeyBundlePublic> {
  const data = await apiFetch<{ bundle: PreKeyBundlePublic }>(
    `/keys/${userId}`,
  );
  return data.bundle;
}

export async function requestE2E(
  conversationId: string,
  keyData: { salt: string; verifier: string },
): Promise<{ conversation: import("@hien-nha/shared").ConversationPublic }> {
  return apiFetch(`/conversations/${conversationId}/e2e/request`, {
    method: "POST",
    body: JSON.stringify(keyData),
  });
}

export async function fetchPendingE2E(): Promise<PendingE2ERequest | null> {
  const data = await apiFetch<{ request: PendingE2ERequest | null }>(
    "/e2e/pending",
  );
  return data.request;
}

export async function fetchE2ESalt(
  conversationId: string,
): Promise<{ salt: string }> {
  return apiFetch(`/conversations/${conversationId}/e2e/key-info`);
}

export async function verifyE2EKey(
  conversationId: string,
  verifier: string,
): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/e2e/verify`, {
    method: "POST",
    body: JSON.stringify({ verifier }),
  });
}

export async function disableE2E(conversationId: string) {
  return apiFetch<{ conversation: import("@hien-nha/shared").ConversationPublic }>(
    `/conversations/${conversationId}/e2e/disable`,
    { method: "POST" },
  );
}

export { subscribePush, fetchVapidPublicKey } from "./push-api";

export async function pinMessage(
  conversationId: string,
  messageId: string,
): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/pins/${messageId}`, {
    method: "POST",
  });
}

export async function unpinMessage(
  conversationId: string,
  messageId: string,
): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/pins/${messageId}`, {
    method: "DELETE",
  });
}

export async function fetchPinnedMessages(
  conversationId: string,
): Promise<string[]> {
  const data = await apiFetch<{ pins: string[] }>(
    `/conversations/${conversationId}/pins`,
  );
  return data.pins;
}
