import { z } from "zod";
import type { UserPublic } from "./auth.js";

export const createDirectConversationSchema = z.object({
  type: z.literal("direct").default("direct"),
  userId: z.string().uuid("User ID không hợp lệ"),
});

export const createGroupConversationSchema = z.object({
  type: z.literal("group"),
  name: z.string().min(1, "Tên nhóm không được trống").max(128),
  memberIds: z
    .array(z.string().uuid())
    .min(1, "Chọn ít nhất 1 thành viên")
    .max(49),
});

export const createConversationSchema = z.discriminatedUnion("type", [
  createDirectConversationSchema,
  createGroupConversationSchema,
]);

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
});

export const renameGroupSchema = z.object({
  name: z.string().min(1).max(128),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Nội dung không được trống").max(50000),
  contentType: z.enum(["text", "image", "voice", "file", "poll"]).default("text"),
  replyToId: z.string().uuid().optional(),
  encrypted: z.boolean().optional(),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(8),
});

export const createInviteSchema = z.object({
  conversationId: z.string().uuid().optional(),
  maxUses: z.number().int().min(1).max(100).default(10),
  expiresInHours: z.number().int().min(1).max(168).default(24),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;

export const updateConversationSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  settings: z
    .object({
      themeOverride: z.string().nullable().optional(),
      wallpaperUrl: z.string().url().nullable().optional(),
      disappearAfterHours: z.number().int().min(0).max(168).nullable().optional(),
      locked: z.boolean().optional(),
    })
    .optional(),
});

export const uploadPreKeyBundleSchema = z.object({
  identityKeyPublic: z.string().min(1),
  signedPreKeyPublic: z.string().min(1),
  signedPreKeyId: z.number().int(),
  signedPreKeySignature: z.string().optional().default(""),
  oneTimePreKeys: z
    .array(z.object({ id: z.number().int(), publicKey: z.string().min(1) }))
    .max(100)
    .default([]),
});

export type PreKeyBundleInput = z.infer<typeof uploadPreKeyBundleSchema>;

export interface PendingE2ERequest {
  conversationId: string;
  requesterId: string;
  requesterName: string;
  salt: string;
}

export type ContentType = "text" | "image" | "voice" | "file" | "poll";
export type ConversationType = "direct" | "group";
export type EncryptionMode = "standard" | "e2e";
export type PresenceStatus = "online" | "offline" | "away";

export interface ImageContent {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface VoiceContent {
  url: string;
  duration: number;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  user?: Pick<UserPublic, "id" | "displayName">;
}

export interface MessagePublic {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: ContentType;
  encrypted: boolean;
  replyToId: string | null;
  replyTo?: Pick<
    MessagePublic,
    "id" | "content" | "contentType" | "senderId" | "sender"
  > | null;
  reactions?: MessageReaction[];
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  sender?: Pick<UserPublic, "id" | "displayName" | "avatarUrl">;
  decryptionState?: "locked" | "revealed";
}

export interface ConversationMemberPublic {
  userId: string;
  role: "admin" | "member";
  user: UserPublic;
}

export interface ConversationPublic {
  id: string;
  type: ConversationType;
  name: string | null;
  settings: ConversationSettings;
  members: ConversationMemberPublic[];
  lastMessage: MessagePublic | null;
  unreadCount: number;
  createdAt: string;
  displayName: string;
  displayAvatar: string | null;
  encryptionMode: EncryptionMode;
  otherUserId?: string;
  memberCount?: number;
}

export interface ConversationSettings {
  encryptionMode?: EncryptionMode;
  e2eStatus?: "pending" | "active";
  e2eRequesterId?: string;
  themeOverride?: string | null;
  wallpaperUrl?: string | null;
  disappearAfterHours?: number | null;
  locked?: boolean;
}

export interface MessagesPage {
  messages: MessagePublic[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface InvitePublic {
  code: string;
  conversationId: string | null;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  conversationName?: string | null;
}

export function parseImageContent(content: string): ImageContent | null {
  try {
    return JSON.parse(content) as ImageContent;
  } catch {
    return null;
  }
}

export function parseVoiceContent(content: string): VoiceContent | null {
  try {
    return JSON.parse(content) as VoiceContent;
  } catch {
    return null;
  }
}

export function getMessagePreview(message: MessagePublic): string {
  if (message.deletedAt) return "Tin nhắn đã bị xóa";
  if (message.encrypted) return "🔒 Tin mã hóa";
  switch (message.contentType) {
    case "image":
      return "📷 Ảnh";
    case "voice":
      return "🎤 Tin thoại";
    case "poll":
      return "📊 Bình chọn";
    case "file":
      return "📎 Tệp đính kèm";
    default:
      return message.content;
  }
}
