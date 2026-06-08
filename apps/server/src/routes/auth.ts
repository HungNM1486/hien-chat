import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "@hien-nha/shared";
import { db } from "../db/index.js";
import { invites, users } from "../db/schema.js";
import { saveAvatar } from "../services/media.js";
import {
  authenticate,
  clearRefreshCookie,
  createRefreshSession,
  revokeRefreshToken,
  rotateRefreshToken,
  setRefreshCookie,
  signAccessToken,
} from "../lib/auth.js";
import { toUserPublic } from "../lib/user-mapper.js";

const REQUIRE_INVITE = process.env.REQUIRE_INVITE !== "false";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const { email, password, displayName, inviteCode } = parsed.data;

    if (REQUIRE_INVITE) {
      if (!inviteCode) {
        return reply.code(400).send({ error: "Cần mã mời để đăng ký" });
      }

      const [invite] = await db
        .select()
        .from(invites)
        .where(
          and(
            eq(invites.code, inviteCode),
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
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return reply.code(409).send({ error: "Email đã được sử dụng" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        displayName,
        settings: { theme: "midnight", locale: "vi", fontSize: "normal" },
      })
      .returning();

    const refreshToken = await createRefreshSession(user.id);
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    setRefreshCookie(reply, refreshToken);

    return reply.code(201).send({
      user: toUserPublic(user),
      accessToken,
    });
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user?.passwordHash) {
      return reply.code(401).send({ error: "Email hoặc mật khẩu không đúng" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: "Email hoặc mật khẩu không đúng" });
    }

    const refreshToken = await createRefreshSession(user.id);
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    setRefreshCookie(reply, refreshToken);

    return { user: toUserPublic(user), accessToken };
  });

  app.post("/auth/refresh", async (request, reply) => {
    const refreshToken = request.cookies.refresh_token;
    if (!refreshToken) {
      return reply.code(401).send({ error: "No refresh token" });
    }

    const result = await rotateRefreshToken(refreshToken);
    if (!result) {
      clearRefreshCookie(reply);
      return reply.code(401).send({ error: "Refresh token invalid" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, result.userId))
      .limit(1);

    if (!user) {
      return reply.code(401).send({ error: "User not found" });
    }

    setRefreshCookie(reply, result.refreshToken);

    return {
      user: toUserPublic(user),
      accessToken: result.accessToken,
    };
  });

  app.post("/auth/logout", async (request, reply) => {
    const refreshToken = request.cookies.refresh_token;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    clearRefreshCookie(reply);
    return { ok: true };
  });

  app.get(
    "/auth/me",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      return { user: toUserPublic(user) };
    },
  );

  app.patch(
    "/users/me",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const [current] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!current) {
        return reply.code(404).send({ error: "User not found" });
      }

      const updates: Partial<typeof users.$inferInsert> = {};
      if (parsed.data.displayName) {
        updates.displayName = parsed.data.displayName;
      }
      if (parsed.data.avatarUrl !== undefined) {
        updates.avatarUrl = parsed.data.avatarUrl;
      }
      if (parsed.data.settings) {
        updates.settings = {
          ...(current.settings as Record<string, unknown>),
          ...parsed.data.settings,
        };
      }

      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning();

      return { user: toUserPublic(user) };
    },
  );

  app.post(
    "/users/me/avatar",
    { preHandler: authenticate },
    async (request, reply) => {
      const userId = request.user?.sub;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "Không có file ảnh" });
      }

      const buffer = await file.toBuffer();
      let avatarUrl: string;
      try {
        avatarUrl = await saveAvatar(buffer, file.mimetype);
      } catch (err) {
        return reply.code(400).send({
          error: err instanceof Error ? err.message : "Upload thất bại",
        });
      }

      const [user] = await db
        .update(users)
        .set({ avatarUrl })
        .where(eq(users.id, userId))
        .returning();

      return { user: toUserPublic(user), avatarUrl };
    },
  );
}
