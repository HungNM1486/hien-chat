import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { uploadPreKeyBundleSchema } from "@hien-nha/shared";
import { authenticate } from "../lib/auth.js";
import { db } from "../db/index.js";
import { userPreKeys } from "../db/schema.js";

export async function keyRoutes(app: FastifyInstance) {
  app.post(
    "/keys/upload",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const parsed = uploadPreKeyBundleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const data = parsed.data;
      await db
        .insert(userPreKeys)
        .values({
          userId,
          identityKeyPublic: data.identityKeyPublic,
          signedPreKeyPublic: data.signedPreKeyPublic,
          signedPreKeyId: data.signedPreKeyId,
          signedPreKeySignature: data.signedPreKeySignature ?? "",
          oneTimePreKeys: data.oneTimePreKeys,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userPreKeys.userId,
          set: {
            identityKeyPublic: data.identityKeyPublic,
            signedPreKeyPublic: data.signedPreKeyPublic,
            signedPreKeyId: data.signedPreKeyId,
            signedPreKeySignature: data.signedPreKeySignature ?? "",
            oneTimePreKeys: data.oneTimePreKeys,
            updatedAt: new Date(),
          },
        });

      return { ok: true };
    },
  );

  app.get("/keys/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };

    const [row] = await db
      .select()
      .from(userPreKeys)
      .where(eq(userPreKeys.userId, userId))
      .limit(1);

    if (!row) {
      return reply.code(404).send({ error: "Chưa có pre-key bundle" });
    }

    const otp = row.oneTimePreKeys[0];
    let oneTimePreKeys = row.oneTimePreKeys;

    if (otp) {
      oneTimePreKeys = row.oneTimePreKeys.slice(1);
      await db
        .update(userPreKeys)
        .set({ oneTimePreKeys, updatedAt: new Date() })
        .where(eq(userPreKeys.userId, userId));
    }

    return {
      bundle: {
        identityKeyPublic: row.identityKeyPublic,
        signedPreKeyPublic: row.signedPreKeyPublic,
        signedPreKeyId: row.signedPreKeyId,
        signedPreKeySignature: row.signedPreKeySignature,
        oneTimePreKeyPublic: otp?.publicKey,
        oneTimePreKeyId: otp?.id,
      },
    };
  });
}
