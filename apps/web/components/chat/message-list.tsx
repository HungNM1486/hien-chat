"use client";

import { useEffect, useRef, useState } from "react";
import type { MessagePublic } from "@hien-nha/shared";
import { ImageBubble } from "@/components/chat/image-bubble";
import { VoiceBubble } from "@/components/chat/voice-bubble";
import { ReplyPreview } from "@/components/chat/reply-preview";
import { MessageContextMenu } from "@/components/chat/message-context-menu";
import { cn } from "@/lib/utils";

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return "Hôm nay";
  if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function groupReactions(reactions: MessagePublic["reactions"]) {
  if (!reactions?.length) return [];
  const map = new Map<string, { emoji: string; count: number; mine: boolean }>();
  for (const r of reactions) {
    const key = r.emoji;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { emoji: r.emoji, count: 1, mine: false });
    }
  }
  return Array.from(map.values());
}

interface MessageBubbleProps {
  message: MessagePublic;
  isOwn: boolean;
  isRead?: boolean;
  showSenderName?: boolean;
  currentUserId: string;
  onOpenImage: (url: string) => void;
  onReply: (message: MessagePublic) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onPin?: (message: MessagePublic) => void;
}

export function MessageBubble({
  message,
  isOwn,
  isRead,
  showSenderName,
  currentUserId,
  onOpenImage,
  onReply,
  onReaction,
  onPin,
}: MessageBubbleProps) {
  const isDeleted = !!message.deletedAt;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reactionGroups = groupReactions(message.reactions);
  const myReactions = new Set(
    message.reactions?.filter((r) => r.userId === currentUserId).map((r) => r.emoji),
  );

  const openMenu = (x: number, y: number) => {
    setMenuPos({ x, y });
    setMenuOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      openMenu(touch.clientX, touch.clientY);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const renderContent = () => {
    if (isDeleted) {
      return (
        <p className="whitespace-pre-wrap break-words text-[length:var(--font-size-base)] italic leading-relaxed text-text-primary">
          {message.content}
        </p>
      );
    }

    switch (message.contentType) {
      case "image":
        return <ImageBubble message={message} onOpen={onOpenImage} />;
      case "voice":
        return <VoiceBubble message={message} isOwn={isOwn} />;
      default:
        return (
          <p className="whitespace-pre-wrap break-words text-[length:var(--font-size-base)] leading-relaxed text-text-primary">
            {message.content}
          </p>
        );
    }
  };

  return (
    <>
      <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[85%] rounded-[var(--radius-bubble)] px-4 py-2.5",
            isOwn ? "rounded-br-md bg-bubble-sent" : "rounded-bl-md bg-bubble-received",
            isDeleted && "opacity-70",
          )}
          onContextMenu={isDeleted ? undefined : handleContextMenu}
          onTouchStart={isDeleted ? undefined : handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
        >
          {showSenderName && message.sender && !isOwn && (
            <p className="mb-1 text-xs font-semibold text-primary">
              {message.sender.displayName}
            </p>
          )}

          {message.replyTo && !isDeleted && (
            <div className="mb-2 rounded-lg bg-black/5 px-2 py-1.5">
              <ReplyPreview message={message.replyTo} compact />
            </div>
          )}

          {renderContent()}

          {reactionGroups.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {reactionGroups.map((group) => (
                <button
                  key={group.emoji}
                  type="button"
                  onClick={() => onReaction(message.id, group.emoji)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    myReactions.has(group.emoji)
                      ? "bg-primary/20 text-primary"
                      : "bg-background/50 text-text-secondary",
                  )}
                >
                  {group.emoji} {group.count}
                </button>
              ))}
            </div>
          )}

          <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-text-secondary">
            {message.editedAt && <span>đã sửa · </span>}
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwn && !isDeleted && (
              <span className={cn(isRead ? "text-primary" : "text-text-secondary")}>
                {isRead ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>
      </div>

      <MessageContextMenu
        message={message}
        open={menuOpen}
        position={menuPos}
        onClose={() => setMenuOpen(false)}
        onReply={onReply}
        onReaction={onReaction}
        onPin={onPin}
      />
    </>
  );
}

interface MessageListProps {
  messages: MessagePublic[];
  currentUserId: string;
  isMessageRead: (message: MessagePublic) => boolean;
  showSenderNames?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onOpenImage: (url: string) => void;
  onReply: (message: MessagePublic) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onPin?: (message: MessagePublic) => void;
}

export function MessageList({
  messages,
  currentUserId,
  isMessageRead,
  showSenderNames,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onOpenImage,
  onReply,
  onReaction,
  onPin,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  let lastDay = "";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div
      ref={scrollRef}
      className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
    >
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="mx-auto rounded-full px-4 py-2 text-sm text-primary"
        >
          {isLoadingMore ? "Đang tải..." : "Tải tin cũ hơn"}
        </button>
      )}

      {messages.map((message) => {
        const day = dayLabel(message.createdAt);
        const showDivider = day !== lastDay;
        lastDay = day;

        return (
          <div key={message.id}>
            {showDivider && (
              <div className="my-4 flex justify-center">
                <span className="rounded-full bg-surface px-3 py-1 text-xs text-text-secondary">
                  {day}
                </span>
              </div>
            )}
            <MessageBubble
              message={message}
              isOwn={message.senderId === currentUserId}
              isRead={isMessageRead(message)}
              showSenderName={showSenderNames}
              currentUserId={currentUserId}
              onOpenImage={onOpenImage}
              onReply={onReply}
              onReaction={onReaction}
              onPin={onPin}
            />
          </div>
        );
      })}
    </div>
  );
}
