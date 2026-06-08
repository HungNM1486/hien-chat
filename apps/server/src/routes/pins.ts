import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { authenticate } from "../lib/auth.js";
import { db } from "../db/index.js";
import { messages, pinnedMessages } from "../db/schema.js";
import {
  isConversationMember,
} from "../services/conversations.js";

export async function pinRoutes(app: FastifyInstance) {
  app.get(
    "/conversations/:id/pins",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id } = request.params as { id: string };
      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      const pins = await db
        .select()
        .from(pinnedMessages)
        .where(eq(pinnedMessages.conversationId, id));

      return { pins: pins.map((p) => p.messageId) };
    },
  );

  app.post(
    "/conversations/:id/pins/:messageId",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id, messageId } = request.params as {
        id: string;
        messageId: string;
      };

      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      const [message] = await db
        .select()
        .from(messages)
        .where(
          and(eq(messages.id, messageId), eq(messages.conversationId, id)),
        )
        .limit(1);

      if (!message) return reply.code(404).send({ error: "Not found" });

      await db
        .insert(pinnedMessages)
        .values({
          conversationId: id,
          messageId,
          pinnedBy: userId,
        })
        .onConflictDoNothing();

      return { ok: true, messageId };
    },
  );

  app.delete(
    "/conversations/:id/pins/:messageId",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { id, messageId } = request.params as {
        id: string;
        messageId: string;
      };

      const allowed = await isConversationMember(id, userId);
      if (!allowed) return reply.code(403).send({ error: "Forbidden" });

      await db
        .delete(pinnedMessages)
        .where(
          and(
            eq(pinnedMessages.conversationId, id),
            eq(pinnedMessages.messageId, messageId),
          ),
        );

      return { ok: true };
    },
  );
}
