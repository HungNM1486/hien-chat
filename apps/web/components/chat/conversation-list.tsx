"use client";

import Link from "next/link";
import type { ConversationPublic } from "@hien-nha/shared";
import { getMessagePreview } from "@hien-nha/shared";
import { LockSimpleIcon } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";

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
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
  });
}

interface ConversationItemProps {
  conversation: ConversationPublic;
  activeId?: string | null;
}

export function ConversationItem({ conversation, activeId }: ConversationItemProps) {
  const preview = conversation.lastMessage
    ? getMessagePreview(conversation.lastMessage)
    : "Bắt đầu cuộc trò chuyện";
  const time = conversation.lastMessage?.createdAt ?? conversation.createdAt;
  const hasUnread = conversation.unreadCount > 0;
  const isActive = activeId === conversation.id;

  return (
    <Link
      href={`/chats/${conversation.id}`}
      data-active={isActive}
      className={cn(
        "conversation-item-active-bar pressable flex min-h-[72px] items-center gap-3 px-4 py-3 transition-colors lg:px-5",
        "border-b border-border/40 last:border-b-0",
        isActive
          ? "bg-primary/[0.08] lg:bg-primary/[0.06]"
          : hasUnread
            ? "bg-background lg:bg-surface"
            : "bg-surface hover:bg-foreground/[0.03]",
      )}
    >
      <div className="relative shrink-0">
        <UserAvatar
          name={conversation.displayName}
          avatarUrl={conversation.displayAvatar}
          size="md"
          ring
        />
        {conversation.encryptionMode === "e2e" && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-border/60 bg-surface text-primary shadow-sm">
            <LockSimpleIcon size={10} weight="fill" aria-hidden />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "truncate text-[15px] leading-tight",
              hasUnread || isActive ? "font-semibold text-text-primary" : "font-medium text-text-primary",
            )}
          >
            {conversation.displayName}
          </span>
          <span
            className={cn(
              "shrink-0 font-mono text-[11px] tabular-nums",
              hasUnread ? "font-medium text-primary" : "text-text-secondary",
            )}
          >
            {formatTime(time)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-[13px] leading-snug",
              hasUnread ? "font-medium text-text-primary" : "text-text-secondary",
            )}
          >
            {preview}
          </p>
          {hasUnread && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold tabular-nums text-on-primary">
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
  activeId?: string | null;
}

export function ConversationList({
  conversations,
  isLoading,
  activeId,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border/40 px-4 py-3"
          >
            <div className="h-[52px] w-[52px] skeleton-shimmer rounded-[18px]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/5 skeleton-shimmer rounded-md" />
              <div className="h-3 w-3/5 skeleton-shimmer rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {conversations.map((c) => (
        <ConversationItem key={c.id} conversation={c} activeId={activeId} />
      ))}
    </div>
  );
}
