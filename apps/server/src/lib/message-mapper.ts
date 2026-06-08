import type { MessagePublic } from "@hien-nha/shared";
import type { User } from "../db/schema.js";
import type { messages } from "../db/schema.js";

type MessageRow = typeof messages.$inferSelect;

export function toMessagePublic(
  message: MessageRow,
  sender?: Pick<User, "id" | "displayName" | "avatarUrl">,
): MessagePublic {
  const isDeleted = !!message.deletedAt;
  let content = message.content;
  if (isDeleted) {
    content =
      message.contentType === "text"
        ? "Tin nhắn đã bị xóa"
        : message.content;
  }

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content,
    contentType: message.contentType,
    encrypted: message.encrypted,
    replyToId: message.replyToId,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    deletedAt: message.deletedAt?.toISOString() ?? null,
    sender: sender
      ? {
          id: sender.id,
          displayName: sender.displayName,
          avatarUrl: sender.avatarUrl,
        }
      : undefined,
  };
}
