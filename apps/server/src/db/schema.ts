import { relations } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

export const conversationTypeEnum = pgEnum("conversation_type", [
  "direct",
  "group",
]);

export const memberRoleEnum = pgEnum("member_role", ["admin", "member"]);

export const contentTypeEnum = pgEnum("content_type", [
  "text",
  "image",
  "voice",
  "file",
  "poll",
  "call",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  displayName: varchar("display_name", { length: 64 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 512 }),
  settings: jsonb("settings")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  deviceInfo: jsonb("device_info").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  maxUses: integer("max_uses").notNull().default(10),
  useCount: integer("use_count").notNull().default(0),
  conversationId: uuid("conversation_id").references(() => conversations.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: conversationTypeEnum("type").notNull().default("direct"),
  name: varchar("name", { length: 128 }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  settings: jsonb("settings")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const conversationMembers = pgTable(
  "conversation_members",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.conversationId, table.userId] })],
);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  contentType: contentTypeEnum("content_type").notNull().default("text"),
  encrypted: boolean("encrypted").notNull().default(false),
  replyToId: uuid("reply_to_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const readReceipts = pgTable(
  "read_receipts",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadMessageId: uuid("last_read_message_id").references(
      () => messages.id,
      { onDelete: "set null" },
    ),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.conversationId, table.userId] })],
);

export const MessageReactions = pgTable(
  "message_reactions",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: varchar("emoji", { length: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.messageId, table.userId] })],
);

export const userPreKeys = pgTable("user_prekeys", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  identityKeyPublic: text("identity_key_public").notNull(),
  signedPreKeyPublic: text("signed_pre_key_public").notNull(),
  signedPreKeyId: integer("signed_pre_key_id").notNull(),
  signedPreKeySignature: text("signed_pre_key_signature").notNull().default(""),
  oneTimePreKeys: jsonb("one_time_pre_keys")
    .$type<Array<{ id: number; publicKey: string }>>()
    .notNull()
    .default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const e2eRequests = pgTable("e2e_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  requesterId: uuid("requester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  salt: text("salt").notNull(),
  verifier: text("verifier").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pinnedMessages = pgTable(
  "pinned_messages",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    pinnedBy: uuid("pinned_by")
      .notNull()
      .references(() => users.id),
    pinnedAt: timestamp("pinned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.conversationId, table.messageId] })],
);

export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  messages: many(messages),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  members: many(conversationMembers),
  messages: many(messages),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
