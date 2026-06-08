import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import type {
  ConversationPublic,
  EncryptionMode,
  UserPublic,
} from "@hien-nha/shared";
import { db } from "../db/index.js";
import {
  conversationMembers,
  conversations,
  messages,
  readReceipts,
  users,
} from "../db/schema.js";
import { toMessagePublic } from "../lib/message-mapper.js";
import { toUserPublic } from "../lib/user-mapper.js";

export async function isConversationMember(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const [member] = await db
    .select()
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    )
    .limit(1);

  return !!member;
}

export async function findDirectConversation(
  userId1: string,
  userId2: string,
): Promise<string | null> {
  const result = await db.execute<{ id: string }>(sql`
    SELECT c.id
    FROM conversations c
    INNER JOIN conversation_members cm1
      ON cm1.conversation_id = c.id AND cm1.user_id = ${userId1}
    INNER JOIN conversation_members cm2
      ON cm2.conversation_id = c.id AND cm2.user_id = ${userId2}
    WHERE c.type = 'direct'
    LIMIT 1
  `);

  return result[0]?.id ?? null;
}

async function getUnreadCount(
  conversationId: string,
  userId: string,
): Promise<number> {
  const [receipt] = await db
    .select()
    .from(readReceipts)
    .where(
      and(
        eq(readReceipts.conversationId, conversationId),
        eq(readReceipts.userId, userId),
      ),
    )
    .limit(1);

  const conditions = [
    eq(messages.conversationId, conversationId),
    sql`${messages.senderId} != ${userId}`,
    sql`${messages.deletedAt} IS NULL`,
  ];

  if (receipt?.lastReadMessageId) {
    const [lastRead] = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.id, receipt.lastReadMessageId))
      .limit(1);

    if (lastRead) {
      conditions.push(gt(messages.createdAt, lastRead.createdAt));
    }
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(...conditions));

  return row?.count ?? 0;
}

async function getLastMessage(
  conversationId: string,
): Promise<ReturnType<typeof toMessagePublic> | null> {
  const [last] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        sql`${messages.deletedAt} IS NULL`,
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(1);

  if (!last) return null;

  const [sender] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, last.senderId))
    .limit(1);

  return toMessagePublic(last, sender);
}

export async function buildConversationPublic(
  conversationId: string,
  currentUserId: string,
): Promise<ConversationPublic | null> {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) return null;

  const members = await db
    .select({
      userId: conversationMembers.userId,
      role: conversationMembers.role,
      user: users,
    })
    .from(conversationMembers)
    .innerJoin(users, eq(conversationMembers.userId, users.id))
    .where(eq(conversationMembers.conversationId, conversationId));

  const memberPublics = members.map((m) => ({
    userId: m.userId,
    role: m.role,
    user: toUserPublic(m.user),
  }));

  const otherMember = memberPublics.find((m) => m.userId !== currentUserId);
  const settings = conversation.settings as Record<string, unknown>;
  const encryptionMode = (settings.encryptionMode as EncryptionMode) ?? "standard";

  let displayName = conversation.name ?? "Cuộc trò chuyện";
  let displayAvatar: string | null = null;
  let otherUserId: string | undefined;

  if (conversation.type === "direct" && otherMember) {
    displayName = otherMember.user.displayName;
    displayAvatar = otherMember.user.avatarUrl;
    otherUserId = otherMember.userId;
  } else if (conversation.type === "group") {
    displayName =
      conversation.name ??
      memberPublics
        .slice(0, 3)
        .map((m) => m.user.displayName)
        .join(", ");
    displayAvatar = null;
  }

  const lastMessage = await getLastMessage(conversationId);
  const unreadCount = await getUnreadCount(conversationId, currentUserId);

  return {
    id: conversation.id,
    type: conversation.type,
    name: conversation.name,
    settings,
    members: memberPublics,
    lastMessage,
    unreadCount,
    createdAt: conversation.createdAt.toISOString(),
    displayName,
    displayAvatar,
    encryptionMode,
    otherUserId,
    memberCount: memberPublics.length,
  };
}

export async function listConversationsForUser(
  userId: string,
): Promise<ConversationPublic[]> {
  const memberRows = await db
    .select({ conversationId: conversationMembers.conversationId })
    .from(conversationMembers)
    .where(eq(conversationMembers.userId, userId));

  const results: ConversationPublic[] = [];

  for (const row of memberRows) {
    const conv = await buildConversationPublic(row.conversationId, userId);
    if (conv) results.push(conv);
  }

  results.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? a.createdAt;
    const bTime = b.lastMessage?.createdAt ?? b.createdAt;
    return bTime.localeCompare(aTime);
  });

  return results;
}

export async function getConversationMemberIds(
  conversationId: string,
): Promise<string[]> {
  const members = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(eq(conversationMembers.conversationId, conversationId));

  return members.map((m) => m.userId);
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
  messageId: string,
): Promise<void> {
  const [message] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.id, messageId),
        eq(messages.conversationId, conversationId),
      ),
    )
    .limit(1);

  if (!message) return;

  await db
    .insert(readReceipts)
    .values({
      conversationId,
      userId,
      lastReadMessageId: messageId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [readReceipts.conversationId, readReceipts.userId],
      set: {
        lastReadMessageId: messageId,
        updatedAt: new Date(),
      },
    });
}

export async function getOtherMemberReadReceipt(
  conversationId: string,
  currentUserId: string,
): Promise<string | null> {
  const memberIds = await getConversationMemberIds(conversationId);
  const otherIds = memberIds.filter((id) => id !== currentUserId);
  if (otherIds.length === 0) return null;

  const receipts = await db
    .select()
    .from(readReceipts)
    .where(
      and(
        eq(readReceipts.conversationId, conversationId),
        inArray(readReceipts.userId, otherIds),
      ),
    );

  return receipts[0]?.lastReadMessageId ?? null;
}

export async function listUsersExcept(
  currentUserId: string,
): Promise<UserPublic[]> {
  const allUsers = await db
    .select()
    .from(users)
    .where(sql`${users.id} != ${currentUserId}`);

  return allUsers.map(toUserPublic);
}
