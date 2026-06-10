import type { FastifyInstance } from "fastify";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { authenticate } from "../lib/auth.js";
import { db } from "../db/index.js";
import {
  conversations,
  e2eRequests,
  users,
} from "../db/schema.js";
import {
  buildConversationPublic,
  getConversationMemberIds,
  isConversationMember,
} from "../services/conversations.js";
import { wsHub } from "../ws/handler.js";

const sharedSecretRequestSchema = z.object({
  salt: z.string().min(16).max(128),
  verifier: z.string().min(32).max(128),
});

const sharedSecretAcceptSchema = z.object({
  verifier: z.string().min(32).max(128),
});

const ACTIVE_E2E_STATUSES = ["active", "accepted", "pending"] as const;

export async function e2eRoutes(app: FastifyInstance) {
  app.get(
    "/conversations/:id/e2e/key-info",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });
      const { id } = request.params as { id: string };
      if (!(await isConversationMember(id, userId))) {
        return reply.code(403).send({ error: "Forbidden" });
      }

      const [keyInfo] = await db
        .select({ salt: e2eRequests.salt })
        .from(e2eRequests)
        .where(
          and(
            eq(e2eRequests.conversationId, id),
            inArray(e2eRequests.status, [...ACTIVE_E2E_STATUSES]),
          ),
        )
        .orderBy(desc(e2eRequests.createdAt))
        .limit(1);

      if (!keyInfo) {
        return reply.code(404).send({ error: "Không tìm thấy thông tin khóa" });
      }
      return keyInfo;
    },
  );

  app.post(
    "/conversations/:id/e2e/verify",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });
      const { id } = request.params as { id: string };
      if (!(await isConversationMember(id, userId))) {
        return reply.code(403).send({ error: "Forbidden" });
      }
      const parsed = sharedSecretAcceptSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Mã xác nhận không hợp lệ" });
      }

      const [keyInfo] = await db
        .select({ verifier: e2eRequests.verifier })
        .from(e2eRequests)
        .where(
          and(
            eq(e2eRequests.conversationId, id),
            inArray(e2eRequests.status, [...ACTIVE_E2E_STATUSES]),
          ),
        )
        .orderBy(desc(e2eRequests.createdAt))
        .limit(1);

      if (!keyInfo || keyInfo.verifier !== parsed.data.verifier) {
        return reply.code(403).send({ error: "Mã bí mật không đúng" });
      }
      return { ok: true };
    },
  );

  app.get(
    "/e2e/pending",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const pending = await db
        .select({
          conversationId: e2eRequests.conversationId,
          requesterId: e2eRequests.requesterId,
          requesterName: users.displayName,
          salt: e2eRequests.salt,
        })
        .from(e2eRequests)
        .innerJoin(users, eq(e2eRequests.requesterId, users.id))
        .where(
          and(
            inArray(e2eRequests.status, [...ACTIVE_E2E_STATUSES]),
            ne(e2eRequests.requesterId, userId),
          ),
        );

      for (const item of pending) {
        if (await isConversationMember(item.conversationId, userId)) {
          return { request: item };
        }
      }

      return { request: null };
    },
  );

  app.post(
    "/conversations/:id/e2e/request",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);

      if (!conv || conv.type !== "direct") {
        return reply
          .code(400)
          .send({ error: "E2E chỉ hỗ trợ chat 1-1" });
      }

      const parsed = sharedSecretRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Dữ liệu khóa không hợp lệ" });
      }

      const settings = conv.settings as Record<string, unknown>;
      if (settings.encryptionMode === "e2e") {
        return reply.code(400).send({ error: "Cuộc chat đã bật E2E" });
      }

      const [requester] = await db
        .select({ displayName: users.displayName })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      await db
        .update(e2eRequests)
        .set({ status: "superseded" })
        .where(
          and(
            eq(e2eRequests.conversationId, id),
            inArray(e2eRequests.status, [...ACTIVE_E2E_STATUSES]),
          ),
        );

      await db.insert(e2eRequests).values({
        conversationId: id,
        requesterId: userId,
        salt: parsed.data.salt,
        verifier: parsed.data.verifier,
        status: "active",
      });

      const [updated] = await db
        .update(conversations)
        .set({
          settings: {
            ...settings,
            encryptionMode: "e2e",
            e2eStatus: "active",
            e2eRequesterId: userId,
          },
        })
        .where(eq(conversations.id, id))
        .returning();

      const memberIds = await getConversationMemberIds(id);
      for (const memberId of memberIds) {
        const conversation = await buildConversationPublic(updated.id, memberId);
        if (!conversation) continue;
        wsHub.sendToUser(memberId, {
          type: "conversation:update",
          conversation,
        });
        if (memberId !== userId) {
          wsHub.sendToUser(memberId, {
            type: "e2e:request",
            conversationId: id,
            requesterId: userId,
            requesterName: requester?.displayName ?? "Người dùng",
            salt: parsed.data.salt,
          });
          wsHub.sendToUser(memberId, {
            type: "e2e:enabled",
            conversationId: id,
          });
        }
      }

      const conversation = await buildConversationPublic(updated.id, userId);
      return { conversation };
    },
  );

  app.post(
    "/conversations/:id/e2e/disable",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);

      if (!conv) return reply.code(404).send({ error: "Not found" });

      const settings = { ...(conv.settings as Record<string, unknown>) };
      const requesterId = settings.e2eRequesterId as string | undefined;
      if (requesterId && requesterId !== userId) {
        return reply
          .code(403)
          .send({ error: "Chỉ người khởi tạo mới có thể tắt E2EE" });
      }

      await db
        .update(e2eRequests)
        .set({ status: "superseded" })
        .where(
          and(
            eq(e2eRequests.conversationId, id),
            inArray(e2eRequests.status, [...ACTIVE_E2E_STATUSES]),
          ),
        );

      delete settings.e2eStatus;
      delete settings.e2eRequesterId;
      const [updated] = await db
        .update(conversations)
        .set({
          settings: {
            ...settings,
            encryptionMode: "standard",
          },
        })
        .where(eq(conversations.id, id))
        .returning();

      const memberIds = await getConversationMemberIds(id);
      for (const memberId of memberIds) {
        const conversation = await buildConversationPublic(updated.id, memberId);
        if (!conversation) continue;
        wsHub.sendToUser(memberId, {
          type: "e2e:disabled",
          conversationId: id,
        });
        wsHub.sendToUser(memberId, {
          type: "conversation:update",
          conversation,
        });
      }

      const conversation = await buildConversationPublic(updated.id, userId);
      return { conversation };
    },
  );
}
