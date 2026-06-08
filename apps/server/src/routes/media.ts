import type { FastifyInstance } from "fastify";
import { authenticate } from "../lib/auth.js";
import { saveMediaUpload } from "../services/media.js";

export async function mediaRoutes(app: FastifyInstance) {
  app.post(
    "/media/upload",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "Không có file" });
      }

      const kind = (request.query as { kind?: string }).kind;
      if (kind !== "image" && kind !== "voice") {
        return reply.code(400).send({ error: "kind phải là image hoặc voice" });
      }

      const buffer = await file.toBuffer();
      try {
        const result = await saveMediaUpload(buffer, file.mimetype, kind);
        return { ...result, kind };
      } catch (err) {
        return reply.code(400).send({
          error: err instanceof Error ? err.message : "Upload thất bại",
        });
      }
    },
  );
}
