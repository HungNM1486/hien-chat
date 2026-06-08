import type { FastifyInstance } from "fastify";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { createInviteSchema } from "@hien-nha/shared";
import { authenticate } from "../lib/auth.js";
import { db } from "../db/index.js";
import {
  conversationMembers,
  conversations,
  invites,
} from "../db/schema.js";
import {
  buildConversationPublic,
  isConversationMember,
} from "../services/conversations.js";

function generateInviteCode(): string {
  return randomBytes(6).toString("base64url").slice(0, 8).toUpperCase();
}

export async function inviteRoutes(app: FastifyInstance) {
  app.post(
    "/invites",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const parsed = createInviteSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const { conversationId, maxUses, expiresInHours } = parsed.data;

      if (conversationId) {
        const role = await isConversationMember(conversationId, userId);
        if (!role) {
          return reply.code(403).send({ error: "Forbidden" });
        }
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      let code = generateInviteCode();
      for (let i = 0; i < 5; i++) {
        const existing = await db
          .select()
          .from(invites)
          .where(eq(invites.code, code))
          .limit(1);
        if (existing.length === 0) break;
        code = generateInviteCode();
      }

      const [invite] = await db
        .insert(invites)
        .values({
          code,
          createdBy: userId,
          expiresAt,
          maxUses,
          conversationId: conversationId ?? null,
        })
        .returning();

      const webUrl =
        process.env.WEB_PUBLIC_URL ?? "http://localhost:3000";

      return reply.code(201).send({
        invite: {
          code: invite.code,
          conversationId: invite.conversationId,
          expiresAt: invite.expiresAt.toISOString(),
          maxUses: invite.maxUses,
          useCount: invite.useCount,
          link: `${webUrl}/invite/${invite.code}`,
        },
      });
    },
  );

  app.get("/invites/:code", async (request, reply) => {
    const { code } = request.params as { code: string };

    const [invite] = await db
      .select()
      .from(invites)
      .where(
        and(eq(invites.code, code.toUpperCase()), gt(invites.expiresAt, new Date())),
      )
      .limit(1);

    if (!invite || invite.useCount >= invite.maxUses) {
      return reply.code(404).send({ error: "Mã mời không hợp lệ hoặc đã hết hạn" });
    }

    let conversationName: string | null = null;
    if (invite.conversationId) {
      const [conv] = await db
        .select({ name: conversations.name })
        .from(conversations)
        .where(eq(conversations.id, invite.conversationId))
        .limit(1);
      conversationName = conv?.name ?? null;
    }

    return {
      invite: {
        code: invite.code,
        conversationId: invite.conversationId,
        expiresAt: invite.expiresAt.toISOString(),
        maxUses: invite.maxUses,
        useCount: invite.useCount,
        conversationName,
      },
    };
  });

  app.post(
    "/invites/:code/accept",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { code } = request.params as { code: string };

      const [invite] = await db
        .select()
        .from(invites)
        .where(
          and(
            eq(invites.code, code.toUpperCase()),
            gt(invites.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!invite || invite.useCount >= invite.maxUses) {
        return reply.code(400).send({ error: "Mã mời không hợp lệ hoặc đã hết hạn" });
      }

      await db
        .update(invites)
        .set({ useCount: invite.useCount + 1 })
        .where(eq(invites.id, invite.id));

      if (invite.conversationId) {
        const already = await isConversationMember(
          invite.conversationId,
          userId,
        );
        if (!already) {
          await db.insert(conversationMembers).values({
            conversationId: invite.conversationId,
            userId,
            role: "member",
          });
        }

        const conversation = await buildConversationPublic(
          invite.conversationId,
          userId,
        );
        return { conversationId: invite.conversationId, conversation };
      }

      return { ok: true, conversationId: null };
    },
  );
}
