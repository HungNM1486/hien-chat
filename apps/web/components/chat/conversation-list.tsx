"use client";

import Link from "next/link";
import type { ConversationPublic } from "@hien-nha/shared";
import { getMessagePreview } from "@hien-nha/shared";

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
  });
}

interface ConversationItemProps {
  conversation: ConversationPublic;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const preview = conversation.lastMessage
    ? getMessagePreview(conversation.lastMessage)
    : "Bắt đầu cuộc trò chuyện";
  const time = conversation.lastMessage?.createdAt ?? conversation.createdAt;

  return (
    <Link
      href={`/chats/${conversation.id}`}
      className="flex min-h-[72px] items-center gap-3 px-4 py-3 transition-colors active:bg-white/5"
    >
      <div className="relative shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
          {conversation.displayAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={conversation.displayAvatar}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            conversation.displayName.charAt(0).toUpperCase()
          )}
        </div>
        {conversation.encryptionMode === "e2e" && (
          <span className="absolute -bottom-0.5 -right-0.5 text-xs">🔒</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-text-primary">
            {conversation.displayName}
          </span>
          <span className="shrink-0 text-xs text-text-secondary">
            {formatTime(time)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-sm text-text-secondary">{preview}</p>
          {conversation.unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-on-primary">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

interface ConversationListProps {
  conversations: ConversationPublic[];
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto divide-y divide-border">
      {conversations.map((c) => (
        <ConversationItem key={c.id} conversation={c} />
      ))}
    </div>
  );
}
