import type {
  ConversationPublic,
  InvitePublic,
  MessagePublic,
  MessagesPage,
  SendMessageInput,
  UserPublic,
} from "@hien-nha/shared";
import { apiFetch, getAccessToken } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchConversations(): Promise<ConversationPublic[]> {
  const data = await apiFetch<{ conversations: ConversationPublic[] }>(
    "/conversations",
  );
  return data.conversations;
}

export async function fetchUsers(): Promise<UserPublic[]> {
  const data = await apiFetch<{ users: UserPublic[] }>("/users");
  return data.users;
}

export async function createDirectConversation(
  userId: string,
): Promise<ConversationPublic> {
  const data = await apiFetch<{ conversation: ConversationPublic }>(
    "/conversations",
    {
      method: "POST",
      body: JSON.stringify({ type: "direct", userId }),
    },
  );
  return data.conversation;
}

export async function fetchConversation(id: string): Promise<{
  conversation: ConversationPublic;
  otherReadMessageId: string | null;
  otherUserOnline: boolean;
}> {
  return apiFetch(`/conversations/${id}`);
}

export async function fetchMessages(
  conversationId: string,
  cursor?: string,
): Promise<MessagesPage> {
  const params = new URLSearchParams({ limit: "50" });
  if (cursor) params.set("cursor", cursor);
  return apiFetch(`/conversations/${conversationId}/messages?${params}`);
}

export async function sendMessage(
  conversationId: string,
  input: SendMessageInput,
): Promise<MessagePublic> {
  const data = await apiFetch<{ message: MessagePublic }>(
    `/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return data.message;
}

export async function editMessage(
  messageId: string,
  content: string,
): Promise<MessagePublic> {
  const data = await apiFetch<{ message: MessagePublic }>(
    `/messages/${messageId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ content }),
    },
  );
  return data.message;
}

export async function deleteMessage(messageId: string): Promise<void> {
  await apiFetch(`/messages/${messageId}`, { method: "DELETE" });
}

export async function markConversationRead(
  conversationId: string,
  messageId: string,
): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/read`, {
    method: "POST",
    body: JSON.stringify({ messageId }),
  });
}

export async function updateConversationSettings(
  conversationId: string,
  settings: { themeOverride?: string | null; wallpaperUrl?: string | null },
): Promise<ConversationPublic> {
  const data = await apiFetch<{ conversation: ConversationPublic }>(
    `/conversations/${conversationId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ settings }),
    },
  );
  return data.conversation;
}

export async function createGroupConversation(
  name: string,
  memberIds: string[],
): Promise<ConversationPublic> {
  const data = await apiFetch<{ conversation: ConversationPublic }>(
    "/conversations",
    {
      method: "POST",
      body: JSON.stringify({ type: "group", name, memberIds }),
    },
  );
  return data.conversation;
}

export async function addGroupMember(
  conversationId: string,
  userId: string,
): Promise<ConversationPublic> {
  const data = await apiFetch<{ conversation: ConversationPublic }>(
    `/conversations/${conversationId}/members`,
    {
      method: "POST",
      body: JSON.stringify({ userId }),
    },
  );
  return data.conversation;
}

export async function leaveGroup(
  conversationId: string,
  userId: string,
): Promise<void> {
  await apiFetch(`/conversations/${conversationId}/members/${userId}`, {
    method: "DELETE",
  });
}

export async function uploadMedia(
  file: Blob,
  kind: "image" | "voice",
  filename = "upload",
): Promise<{ url: string; thumbnailUrl?: string }> {
  const form = new FormData();
  form.append("file", file, filename);
  const token = getAccessToken();
  const res = await fetch(`${API_URL}/media/upload?kind=${kind}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Upload thất bại");
  }
  return data as { url: string; thumbnailUrl?: string };
}

export async function addReaction(
  messageId: string,
  emoji: string,
): Promise<void> {
  await apiFetch(`/messages/${messageId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
}

export async function removeReaction(
  messageId: string,
  emoji: string,
): Promise<void> {
  await apiFetch(
    `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    { method: "DELETE" },
  );
}

export async function createInvite(
  conversationId?: string,
): Promise<{ link: string; code: string }> {
  const data = await apiFetch<{
    invite: { link: string; code: string };
  }>("/invites", {
    method: "POST",
    body: JSON.stringify({ conversationId, maxUses: 10, expiresInHours: 24 }),
  });
  return data.invite;
}

export async function fetchInvite(code: string): Promise<InvitePublic> {
  const data = await apiFetch<{ invite: InvitePublic }>(`/invites/${code}`);
  return data.invite;
}

export async function acceptInvite(
  code: string,
): Promise<{ conversationId: string | null; conversation?: ConversationPublic }> {
  return apiFetch(`/invites/${code}/accept`, { method: "POST" });
}

export function getWsUrl(token: string): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const wsBase = apiUrl.replace(/^http/, "ws");
  return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
}
