import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { refreshTokens, users } from "../db/schema.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES ?? "15m";
const REFRESH_EXPIRES_DAYS = 7;

export interface JwtPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export async function createRefreshSession(
  userId: string,
  deviceInfo?: Record<string, unknown>,
): Promise<string> {
  const token = generateRefreshToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
    deviceInfo,
  });

  return token;
}

export async function rotateRefreshToken(
  oldToken: string,
): Promise<{ accessToken: string; refreshToken: string; userId: string } | null> {
  const tokenHash = hashToken(oldToken);
  const [session] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, session.id));
    }
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) return null;

  await db.delete(refreshTokens).where(eq(refreshTokens.id, session.id));

  const refreshToken = await createRefreshSession(user.id);
  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  return { accessToken, refreshToken, userId: user.id };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
}

export function setRefreshCookie(reply: FastifyReply, token: string): void {
  reply.setCookie("refresh_token", token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_EXPIRES_DAYS * 24 * 60 * 60,
  });
}

export function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie("refresh_token", { path: "/" });
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch {
    reply.code(401).send({ error: "Token invalid or expired" });
  }
}

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}
