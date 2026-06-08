import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authenticate } from "../lib/auth.js";
import { db } from "../db/index.js";
import { pushSubscriptions } from "../db/schema.js";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function pushRoutes(app: FastifyInstance) {
  app.get("/push/vapid-public-key", async () => {
    const key = process.env.VAPID_PUBLIC_KEY ?? "";
    return { publicKey: key };
  });

  app.post(
    "/push/subscribe",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const parsed = subscribeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Validation failed" });
      }

      const { endpoint, keys } = parsed.data;

      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(pushSubscriptions).values({
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        });
      }

      return { ok: true };
    },
  );

  app.delete(
    "/push/subscribe",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const { endpoint } = request.body as { endpoint?: string };
      if (!endpoint) {
        return reply.code(400).send({ error: "endpoint required" });
      }

      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint));

      return { ok: true };
    },
  );
}
