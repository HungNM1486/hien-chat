import type { PreKeyBundleInput } from "@hien-nha/shared";
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

export async function requestE2E(conversationId: string): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/e2e/request`, {
    method: "POST",
  });
}

export async function acceptE2E(conversationId: string) {
  return apiFetch<{ conversation: import("@hien-nha/shared").ConversationPublic }>(
    `/conversations/${conversationId}/e2e/accept`,
    { method: "POST" },
  );
}

export async function declineE2E(conversationId: string): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/e2e/decline`, {
    method: "POST",
  });
}

export async function disableE2E(conversationId: string) {
  return apiFetch<{ conversation: import("@hien-nha/shared").ConversationPublic }>(
    `/conversations/${conversationId}/e2e/disable`,
    { method: "POST" },
  );
}

export async function subscribePush(
  subscription: PushSubscriptionJSON,
): Promise<void> {
  await apiFetch("/push/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
  });
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  const data = await apiFetch<{ publicKey: string }>("/push/vapid-public-key");
  return data.publicKey || null;
}

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
