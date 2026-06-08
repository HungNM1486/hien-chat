import "dotenv/config";
import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import { authRoutes } from "./routes/auth.js";
import { conversationRoutes } from "./routes/conversations.js";
import { inviteRoutes } from "./routes/invites.js";
import { mediaRoutes } from "./routes/media.js";
import { keyRoutes } from "./routes/keys.js";
import { e2eRoutes } from "./routes/e2e.js";
import { pushRoutes } from "./routes/push.js";
import { pinRoutes } from "./routes/pins.js";
import { wsRoutes } from "./ws/handler.js";

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

async function main() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    max: 600,
    timeWindow: "1 minute",
    keyGenerator: (request) =>
      (request.headers["cf-connecting-ip"] as string | undefined) ??
      (request.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
      request.ip,
    allowList: (request) => {
      const path = request.url.split("?")[0] ?? request.url;
      return (
        path.startsWith("/auth/refresh") ||
        path.startsWith("/auth/me") ||
        path === "/health" ||
        path === "/ws"
      );
    },
  });

  await app.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
  });

  await app.register(cookie);
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/",
    decorateReply: false,
  });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(authRoutes);
  await app.register(conversationRoutes);
  await app.register(mediaRoutes);
  await app.register(inviteRoutes);
  await app.register(keyRoutes);
  await app.register(e2eRoutes);
  await app.register(pushRoutes);
  await app.register(pinRoutes);
  await app.register(wsRoutes);

  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Server running at http://localhost:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
