import webpush from "web-push";
import { eq } from "drizzle-orm";
import { getMessagePreview, type MessagePublic } from "@hien-nha/shared";
import { db } from "../db/index.js";
import { pushSubscriptions } from "../db/schema.js";
import { buildConversationPublic } from "./conversations.js";
import { wsHub } from "../ws/hub.js";

export interface PushPayload {
  type: "message" | "call";
  conversationId: string;
  title: string;
  body: string;
  url: string;
}

let vapidReady = false;

function ensureVapid(): boolean {
  if (vapidReady) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
    publicKey,
    privateKey,
  );
  vapidReady = true;
  return true;
}

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3)}...`;
}

async function removeSubscription(endpoint: string): Promise<void> {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

async function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapid()) return;

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subs.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
          { TTL: payload.type === "call" ? 30 : 86400 },
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await removeSubscription(sub.endpoint);
        }
      }
    }),
  );
}

export async function notifyNewMessage(
  recipientId: string,
  conversationId: string,
  message: MessagePublic,
): Promise<void> {
  if (!ensureVapid() || wsHub.isOnline(recipientId)) return;

  const conv = await buildConversationPublic(conversationId, recipientId);
  if (!conv) return;

  const senderName = message.sender?.displayName ?? "Người dùng";
  const title =
    conv.type === "direct" ? senderName : (conv.displayName ?? "Nhóm");

  let body: string;
  if (message.encrypted || conv.encryptionMode === "e2e") {
    body = "Bạn có tin nhắn mới";
  } else if (conv.type === "group") {
    body = truncate(`${senderName}: ${getMessagePreview(message)}`);
  } else {
    body = truncate(getMessagePreview(message));
  }

  await sendToUser(recipientId, {
    type: "message",
    conversationId,
    title,
    body,
    url: `/chats/${conversationId}`,
  });
}

export async function notifyIncomingCall(
  recipientId: string,
  conversationId: string,
  callerName: string,
): Promise<void> {
  if (!ensureVapid() || wsHub.isOnline(recipientId)) return;

  await sendToUser(recipientId, {
    type: "call",
    conversationId,
    title: "Cuộc gọi đến",
    body: `${callerName} đang gọi bạn`,
    url: `/chats/${conversationId}`,
  });
}
