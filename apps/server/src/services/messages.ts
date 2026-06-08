import { and, eq, inArray } from "drizzle-orm";
import type { MessagePublic, MessageReaction } from "@hien-nha/shared";
import { db } from "../db/index.js";
import {
  conversationMembers,
  MessageReactions,
  messages,
  users,
} from "../db/schema.js";
import { toMessagePublic } from "../lib/message-mapper.js";

type MessageRow = typeof messages.$inferSelect;
type SenderInfo = Pick<
  typeof users.$inferSelect,
  "id" | "displayName" | "avatarUrl"
>;

export async function enrichMessages(
  rows: MessageRow[],
  senderMap: Map<string, SenderInfo>,
): Promise<MessagePublic[]> {
  if (rows.length === 0) return [];

  const messageIds = rows.map((m) => m.id);
  const replyIds = rows
    .map((m) => m.replyToId)
    .filter((id): id is string => !!id);

  const reactions = await db
    .select()
    .from(MessageReactions)
    .where(inArray(MessageReactions.messageId, messageIds));

  const replyRows =
    replyIds.length > 0
      ? await db.select().from(messages).where(inArray(messages.id, replyIds))
      : [];

  const replyMap = new Map(replyRows.map((m) => [m.id, m]));

  const missingSenderIds = replyRows
    .map((m) => m.senderId)
    .filter((id) => !senderMap.has(id));

  if (missingSenderIds.length > 0) {
    const extraSenders = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(inArray(users.id, [...new Set(missingSenderIds)]));

    for (const s of extraSenders) senderMap.set(s.id, s);
  }

  const reactionsByMessage = new Map<string, MessageReaction[]>();
  for (const r of reactions) {
    const list = reactionsByMessage.get(r.messageId) ?? [];
    list.push({ emoji: r.emoji, userId: r.userId });
    reactionsByMessage.set(r.messageId, list);
  }

  return rows.map((row) => {
    const base = toMessagePublic(row, senderMap.get(row.senderId));
    const replyRow = row.replyToId ? replyMap.get(row.replyToId) : undefined;
    const replySender = replyRow
      ? senderMap.get(replyRow.senderId)
      : undefined;

    return {
      ...base,
      replyTo: replyRow
        ? {
            id: replyRow.id,
            content: replyRow.deletedAt
              ? "Tin nhắn đã bị xóa"
              : replyRow.content,
            contentType: replyRow.contentType,
            senderId: replyRow.senderId,
            sender: replySender
              ? {
                  id: replySender.id,
                  displayName: replySender.displayName,
                  avatarUrl: replySender.avatarUrl,
                }
              : undefined,
          }
        : null,
      reactions: reactionsByMessage.get(row.id) ?? [],
    };
  });
}

export async function getMemberRole(
  conversationId: string,
  userId: string,
): Promise<"admin" | "member" | null> {
  const [member] = await db
    .select({ role: conversationMembers.role })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    )
    .limit(1);

  return member?.role ?? null;
}

export async function enrichSingleMessage(
  message: MessageRow,
  sender?: SenderInfo,
): Promise<MessagePublic> {
  const senderMap = new Map<string, SenderInfo>();
  if (sender) senderMap.set(sender.id, sender);
  const [enriched] = await enrichMessages([message], senderMap);
  return enriched;
}
