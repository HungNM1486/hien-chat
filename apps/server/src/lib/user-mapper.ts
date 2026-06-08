import type { UserSettings, UserPublic } from "@hien-nha/shared";
import type { User } from "../db/schema.js";

export function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    settings: (user.settings ?? {}) as UserSettings,
    createdAt: user.createdAt.toISOString(),
  };
}
