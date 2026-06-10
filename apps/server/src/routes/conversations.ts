import type { FastifyInstance } from "fastify";
import { and, desc, eq, inArray, lt } from "drizzle-orm";
import {
  addMemberSchema,
  createConversationSchema,
  editMessageSchema,
  reactionSchema,
  sendMessageSchema,
  updateConversationSchema,
} from "@hien-nha/shared";
import { authenticate } from "../lib/auth.js";
import { db } from "../db/index.js";
import {
  conversationMembers,
  conversations,
  e2eRequests,
  MessageReactions,
  messages,
  users,
} from "../db/schema.js";
import {
  buildConversationPublic,
  findDirectConversation,
  getConversationMemberIds,
  getOtherMemberReadReceipt,
  isConversationMember,
  listConversationsForUser,
  listUsersExcept,
  markConversationRead,
} from "../services/conversations.js";
import {
  enrichMessages,
  enrichSingleMessage,
  getMemberRole,
} from "../services/messages.js";
import { notifyNewMessage } from "../services/push.js";
import { wsHub } from "../ws/handler.js";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

export async function conversationRoutes(app: FastifyInstance) {
  app.get(
    "/users",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const usersList = await listUsersExcept(userId);
      return { users: usersList };
    },
  );

  app.get(
    "/conversations",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const conversationsList = await listConversationsForUser(userId);
      return { conversations: conversationsList };
    },
  );

  app.post(
    "/conversations",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const parsed = createConversationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      if (parsed.data.type === "direct") {
        const { userId: otherUserId } = parsed.data;
        if (otherUserId === userId) {
          return reply.code(400).send({ error: "Không thể chat với chính mình" });
        }

        const [otherUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        if (!otherUser) {
          return reply.code(404).send({ error: "Người dùng không tồn tại" });
        }

        const existingId = await findDirectConversation(userId, otherUserId);
        if (existingId) {
          const conversation = await buildConversationPublic(existingId, userId);
          return { conversation };
        }

        const [conversation] = await db
          .insert(conversations)
          .values({
            type: "direct",
            createdBy: userId,
            settings: { encryptionMode: "standard" },
          })
          .returning();

        await db.insert(conversationMembers).values([
          { conversationId: conversation.id, userId, role: "member" },
          {
            conversationId: conversation.id,
            userId: otherUserId,
            role: "member",
          },
        ]);

        const result = await buildConversationPublic(conversation.id, userId);
        return reply.code(201).send({ conversation: result });
      }

      const { name, memberIds } = parsed.data;
      const uniqueMembers = [...new Set(memberIds.filter((id) => id !== userId))];

      const [conversation] = await db
        .insert(conversations)
        .values({
          type: "group",
          name,
          createdBy: userId,
          settings: { encryptionMode: "standard" },
        })
        .returning();

      const membersToInsert = [
        { conversationId: conversation.id, userId, role: "admin" as const },
        ...uniqueMembers.map((memberId) => ({
          conversationId: conversation.id,
          userId: memberId,
          role: "member" as const,
        })),
      ];

      await db.insert(conversationMembers).values(membersToInsert);

      const result = await buildConversationPublic(conversation.id, userId);
      return reply.code(201).send({ conversation: result });
    },
  );

  app.post(
    "/conversations/:id/members",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const role = await getMemberRole(id, userId);
      if (role !== "admin") {
        return reply.code(403).send({ error: "Chỉ admin mới thêm thành viên" });
      }

      const parsed = addMemberSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Validation failed" });
      }

      const exists = await isConversationMember(id, parsed.data.userId);
      if (exists) {
        return reply.code(409).send({ error: "Đã là thành viên" });
      }

      await db.insert(conversationMembers).values({
        conversationId: id,
        userId: parsed.data.userId,
        role: "member",
      });

      const conversation = await buildConversationPublic(id, userId);
      return { conversation };
    },
  );

  app.delete(
    "/conversations/:id/members/:memberId",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id, memberId } = request.params as {
        id: string;
        memberId: string;
      };

      const myRole = await getMemberRole(id, userId);
      if (!myRole) return reply.code(403).send({ error: "Forbidden" });

      const isSelf = memberId === userId;
      if (!isSelf && myRole !== "admin") {
        return reply.code(403).send({ error: "Không có quyền" });
      }

      await db
        .delete(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, id),
            eq(conversationMembers.userId, memberId),
          ),
        );

      if (isSelf) return { ok: true, left: true };

      const conversation = await buildConversationPublic(id, userId);
      return { conversation };
    },
  );

  app.get(
    "/conversations/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      const conversation = await buildConversationPublic(id, userId);
      if (!conversation) return reply.code(404).send({ error: "Not found" });

      const otherReadMessageId = await getOtherMemberReadReceipt(id, userId);

      return {
        conversation,
        otherReadMessageId,
        otherUserOnline: conversation.otherUserId
          ? wsHub.isOnline(conversation.otherUserId)
          : false,
      };
    },
  );

  app.get(
    "/conversations/:id/messages",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const { cursor, limit: limitStr } = request.query as {
        cursor?: string;
        limit?: string;
      };

      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      const limit = Math.min(Number(limitStr) || 50, 100);

      const conditions = [eq(messages.conversationId, id)];

      if (cursor) {
        const [cursorMessage] = await db
          .select()
          .from(messages)
          .where(eq(messages.id, cursor))
          .limit(1);

        if (cursorMessage) {
          conditions.push(lt(messages.createdAt, cursorMessage.createdAt));
        }
      }

      const rows = await db
        .select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      pageRows.reverse();

      const senderIds = [...new Set(pageRows.map((m) => m.senderId))];
      const replyIds = pageRows
        .map((m) => m.replyToId)
        .filter((id): id is string => !!id);

      const replyRows =
        replyIds.length > 0
          ? await db
              .select()
              .from(messages)
              .where(inArray(messages.id, replyIds))
          : [];

      const allSenderIds = [
        ...new Set([...senderIds, ...replyRows.map((m) => m.senderId)]),
      ];

      const senders =
        allSenderIds.length > 0
          ? await db
              .select({
                id: users.id,
                displayName: users.displayName,
                avatarUrl: users.avatarUrl,
              })
              .from(users)
              .where(inArray(users.id, allSenderIds))
          : [];

      const senderMap = new Map(senders.map((s) => [s.id, s]));
      const messagePublics = await enrichMessages(pageRows, senderMap);

      return {
        messages: messagePublics,
        nextCursor: hasMore ? pageRows[0]?.id ?? null : null,
        hasMore,
      };
    },
  );

  app.post(
    "/conversations/:id/messages",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      const parsed = sendMessageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const [conversation] = await db
        .select({ settings: conversations.settings })
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);
      const encryptionMode = (
        conversation?.settings as Record<string, unknown> | undefined
      )?.encryptionMode;
      let requiresEncryption = encryptionMode === "e2e";
      if (!requiresEncryption) {
        const [pendingRequest] = await db
          .select({ id: e2eRequests.id })
          .from(e2eRequests)
          .where(
            and(
              eq(e2eRequests.conversationId, id),
              eq(e2eRequests.status, "pending"),
            ),
          )
          .limit(1);
        requiresEncryption = Boolean(pendingRequest);
      }

      if (requiresEncryption) {
        let validCiphertext = false;
        try {
          const payload = JSON.parse(parsed.data.content) as {
            v?: number;
            iv?: unknown;
            ct?: unknown;
          };
          validCiphertext =
            payload.v === 2 &&
            typeof payload.iv === "string" &&
            typeof payload.ct === "string";
        } catch {
          validCiphertext = false;
        }

        if (
          parsed.data.encrypted !== true ||
          parsed.data.contentType !== "text" ||
          !validCiphertext
        ) {
          return reply.code(400).send({
            error: "Cuộc trò chuyện E2EE chỉ nhận tin nhắn văn bản đã mã hóa",
          });
        }
      }

      const [message] = await db
        .insert(messages)
        .values({
          conversationId: id,
          senderId: userId,
          content: parsed.data.content,
          contentType: parsed.data.contentType,
          replyToId: parsed.data.replyToId,
          encrypted: parsed.data.encrypted ?? false,
        })
        .returning();

      const [sender] = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const messagePublic = await enrichSingleMessage(message, sender);

      const memberIds = await getConversationMemberIds(id);
      for (const memberId of memberIds) {
        wsHub.sendToUser(memberId, {
          type: "message:new",
          message: messagePublic,
        });
        if (memberId !== userId) {
          void notifyNewMessage(memberId, id, messagePublic);
        }
      }

      return reply.code(201).send({ message: messagePublic });
    },
  );

  app.patch(
    "/messages/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const parsed = editMessageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const [existing] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id))
        .limit(1);

      if (!existing) return reply.code(404).send({ error: "Not found" });
      if (existing.senderId !== userId) {
        return reply.code(403).send({ error: "Forbidden" });
      }
      if (existing.deletedAt) {
        return reply.code(400).send({ error: "Tin nhắn đã bị xóa" });
      }
      if (existing.encrypted) {
        return reply
          .code(400)
          .send({ error: "Chưa hỗ trợ sửa tin nhắn đã mã hóa" });
      }

      const elapsed = Date.now() - existing.createdAt.getTime();
      if (elapsed > EDIT_WINDOW_MS) {
        return reply.code(400).send({ error: "Hết thời gian chỉnh sửa (15 phút)" });
      }

      const [message] = await db
        .update(messages)
        .set({ content: parsed.data.content, editedAt: new Date() })
        .where(eq(messages.id, id))
        .returning();

      const [sender] = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const messagePublic = await enrichSingleMessage(message, sender);
      const memberIds = await getConversationMemberIds(message.conversationId);
      for (const memberId of memberIds) {
        wsHub.sendToUser(memberId, {
          type: "message:edit",
          message: messagePublic,
        });
      }

      return { message: messagePublic };
    },
  );

  app.delete(
    "/messages/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };

      const [existing] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id))
        .limit(1);

      if (!existing) return reply.code(404).send({ error: "Not found" });
      if (existing.senderId !== userId) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      await db
        .update(messages)
        .set({ deletedAt: new Date() })
        .where(eq(messages.id, id));

      const memberIds = await getConversationMemberIds(existing.conversationId);
      for (const memberId of memberIds) {
        wsHub.sendToUser(memberId, {
          type: "message:delete",
          messageId: id,
          conversationId: existing.conversationId,
        });
      }

      return { ok: true };
    },
  );

  app.post(
    "/conversations/:id/read",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const { messageId } = request.body as { messageId: string };

      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      await markConversationRead(id, userId, messageId);

      const memberIds = await getConversationMemberIds(id);
      for (const memberId of memberIds) {
        if (memberId === userId) continue;
        wsHub.sendToUser(memberId, {
          type: "read:update",
          conversationId: id,
          userId,
          messageId,
        });
      }

      return { ok: true };
    },
  );

  app.patch(
    "/conversations/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      const parsed = updateConversationSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const [current] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);

      if (!current) return reply.code(404).send({ error: "Not found" });

      if (parsed.data.name && current.type === "group") {
        const role = await getMemberRole(id, userId);
        if (role !== "admin") {
          return reply.code(403).send({ error: "Chỉ admin mới đổi tên nhóm" });
        }
      }

      const updates: Partial<typeof conversations.$inferInsert> = {};
      if (parsed.data.name) updates.name = parsed.data.name;
      if (parsed.data.settings) {
        updates.settings = {
          ...(current.settings as Record<string, unknown>),
          ...parsed.data.settings,
        };
      }

      const [updated] = await db
        .update(conversations)
        .set(updates)
        .where(eq(conversations.id, id))
        .returning();

      const conversation = await buildConversationPublic(updated.id, userId);

      const memberIds = await getConversationMemberIds(id);
      for (const memberId of memberIds) {
        const conv = await buildConversationPublic(updated.id, memberId);
        if (!conv) continue;
        wsHub.sendToUser(memberId, {
          type: "conversation:update",
          conversation: conv,
        });
      }

      return { conversation };
    },
  );

  app.post(
    "/messages/:id/reactions",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const parsed = reactionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Validation failed" });
      }

      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id))
        .limit(1);

      if (!message) return reply.code(404).send({ error: "Not found" });

      const allowed = await isConversationMember(message.conversationId, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      await db
        .insert(MessageReactions)
        .values({
          messageId: id,
          userId,
          emoji: parsed.data.emoji,
        })
        .onConflictDoUpdate({
          target: [MessageReactions.messageId, MessageReactions.userId],
          set: { emoji: parsed.data.emoji },
        });

      const memberIds = await getConversationMemberIds(message.conversationId);
      for (const memberId of memberIds) {
        wsHub.sendToUser(memberId, {
          type: "reaction:add",
          conversationId: message.conversationId,
          messageId: id,
          reaction: { emoji: parsed.data.emoji, userId },
        });
      }

      return { ok: true };
    },
  );

  app.delete(
    "/messages/:id/reactions/:emoji",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id, emoji } = request.params as { id: string; emoji: string };

      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, id))
        .limit(1);

      if (!message) return reply.code(404).send({ error: "Not found" });

      await db
        .delete(MessageReactions)
        .where(
          and(
            eq(MessageReactions.messageId, id),
            eq(MessageReactions.userId, userId),
            eq(MessageReactions.emoji, decodeURIComponent(emoji)),
          ),
        );

      const memberIds = await getConversationMemberIds(message.conversationId);
      for (const memberId of memberIds) {
        wsHub.sendToUser(memberId, {
          type: "reaction:remove",
          conversationId: message.conversationId,
          messageId: id,
          userId,
          emoji: decodeURIComponent(emoji),
        });
      }

      return { ok: true };
    },
  );
}
