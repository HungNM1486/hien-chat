import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
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

export async function e2eRoutes(app: FastifyInstance) {
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

      const settings = conv.settings as Record<string, unknown>;
      if (settings.encryptionMode === "e2e") {
        return reply.code(400).send({ error: "Cuộc chat đã bật E2E" });
      }

      const [requester] = await db
        .select({ displayName: users.displayName })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      await db.insert(e2eRequests).values({
        conversationId: id,
        requesterId: userId,
        status: "pending",
      });

      const memberIds = await getConversationMemberIds(id);
      for (const memberId of memberIds) {
        if (memberId === userId) continue;
        wsHub.sendToUser(memberId, {
          type: "e2e:request",
          conversationId: id,
          requesterId: userId,
          requesterName: requester?.displayName ?? "Người dùng",
        });
      }

      return { ok: true };
    },
  );

  app.post(
    "/conversations/:id/e2e/accept",
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

      const [updated] = await db
        .update(conversations)
        .set({
          settings: {
            ...(conv.settings as Record<string, unknown>),
            encryptionMode: "e2e",
          },
        })
        .where(eq(conversations.id, id))
        .returning();

      await db
        .update(e2eRequests)
        .set({ status: "accepted" })
        .where(
          and(
            eq(e2eRequests.conversationId, id),
            eq(e2eRequests.status, "pending"),
          ),
        );

      const memberIds = await getConversationMemberIds(id);
      for (const memberId of memberIds) {
        const conversation = await buildConversationPublic(updated.id, memberId);
        if (!conversation) continue;
        wsHub.sendToUser(memberId, {
          type: "e2e:enabled",
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

  app.post(
    "/conversations/:id/e2e/decline",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      await db
        .update(e2eRequests)
        .set({ status: "declined" })
        .where(
          and(
            eq(e2eRequests.conversationId, id),
            eq(e2eRequests.status, "pending"),
          ),
        );

      const memberIds = await getConversationMemberIds(id);
      for (const memberId of memberIds) {
        if (memberId === userId) continue;
        wsHub.sendToUser(memberId, {
          type: "e2e:disabled",
          conversationId: id,
        });
      }

      return { ok: true };
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

      const [updated] = await db
        .update(conversations)
        .set({
          settings: {
            ...(conv.settings as Record<string, unknown>),
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
