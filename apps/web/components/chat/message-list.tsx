"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MessagePublic } from "@hien-nha/shared";
import {
  ChecksIcon,
  CheckIcon,
  LockKeyIcon,
} from "@phosphor-icons/react";
import { isEncryptedPayload } from "@hien-nha/crypto";
import { CallBubble } from "@/components/chat/call-bubble";
import { ImageBubble } from "@/components/chat/image-bubble";
import { VoiceBubble } from "@/components/chat/voice-bubble";
import { ReplyPreview } from "@/components/chat/reply-preview";
import { DecryptReveal } from "@/components/chat/decrypt-reveal";
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

function encryptedPreview(content: string): string {
  try {
    const parsed = JSON.parse(content) as { ct?: string };
    if (typeof parsed.ct === "string") {
      return parsed.ct.match(/.{1,8}/g)?.slice(0, 6).join(" ") ?? parsed.ct;
    }
  } catch {
    // Show a bounded raw payload when it is not a valid envelope.
  }
  return content.slice(0, 56);
}

interface MessageBubbleProps {
  message: MessagePublic;
  isOwn: boolean;
  isRead?: boolean;
  showSenderName?: boolean;
  showTail?: boolean;
  isGrouped?: boolean;
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
  showTail = true,
  isGrouped = false,
  currentUserId,
  onOpenImage,
  onReply,
  onReaction,
  onPin,
}: MessageBubbleProps) {
  const isDeleted = !!message.deletedAt;
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [decryptAnimating, setDecryptAnimating] = useState(
    message.decryptionState === "revealed",
  );
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (message.decryptionState === "revealed") {
      setDecryptAnimating(true);
    }
  }, [message.decryptionState, message.id]);

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
        <p className="whitespace-pre-wrap break-words text-[length:var(--font-size-base)] italic leading-relaxed opacity-80">
          {message.content}
        </p>
      );
    }

    const showCiphertext =
      message.encrypted ||
      message.decryptionState === "locked" ||
      isEncryptedPayload(message.content);

    if (showCiphertext && message.decryptionState !== "revealed") {
      return (
        <div className="encrypted-message-shell is-locked">
          <div className="encrypted-cipher-noise" aria-hidden />
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">
            <LockKeyIcon size={14} weight="fill" aria-hidden />
            {message.decryptionState === "locked"
              ? "Mã không đúng"
              : "Ciphertext"}
          </div>
          <p className="encrypted-message-code break-all font-mono text-xs leading-relaxed">
            {encryptedPreview(message.content)}
          </p>
        </div>
      );
    }

    switch (message.contentType) {
      case "image":
        return <ImageBubble message={message} onOpen={onOpenImage} />;
      case "voice":
        return <VoiceBubble message={message} isOwn={isOwn} />;
      default:
        return message.decryptionState === "revealed" ? (
          <DecryptReveal
            text={message.content}
            onAnimatingChange={setDecryptAnimating}
          />
        ) : (
          <p className="whitespace-pre-wrap break-words text-[length:var(--font-size-base)] leading-[1.45]">
            {message.content}
          </p>
        );
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex",
          isOwn ? "justify-end" : "justify-start",
          isGrouped ? "mt-0.5" : "mt-2",
        )}
      >
        <div
          className={cn(
            "relative max-w-[82%] px-3.5 py-2.5 md:max-w-[72%] lg:max-w-[min(480px,65%)]",
            isOwn ? "bubble-sent" : "bubble-received",
            isOwn && showTail && "bubble-tail-sent",
            !isOwn && showTail && "bubble-tail-received",
            !showTail && (isOwn ? "rounded-br-[var(--radius-bubble)]" : "rounded-bl-[var(--radius-bubble)]"),
            showTail && "rounded-[var(--radius-bubble)]",
            isDeleted && "opacity-70",
            (message.encrypted ||
              message.decryptionState === "locked" ||
              isEncryptedPayload(message.content)) &&
              message.decryptionState !== "revealed" &&
              "bubble-encrypted",
            message.decryptionState === "revealed" &&
              decryptAnimating &&
              "bubble-decrypting",
          )}
          onContextMenu={isDeleted ? undefined : handleContextMenu}
          onTouchStart={isDeleted ? undefined : handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
        >
          {showSenderName && message.sender && !isOwn && !isGrouped && (
            <p className="mb-1 text-xs font-semibold text-primary">
              {message.sender.displayName}
            </p>
          )}

          {message.replyTo && !isDeleted && (
            <div className="mb-2 rounded-xl bg-background/28 px-2.5 py-1.5">
              <ReplyPreview message={message.replyTo} compact />
            </div>
          )}

          {renderContent()}

          {reactionGroups.length > 0 && (
            <div className="-mb-1 mt-2 flex flex-wrap gap-1">
              {reactionGroups.map((group) => (
                <button
                  key={group.emoji}
                  type="button"
                  onClick={() => onReaction(message.id, group.emoji)}
                  className={cn(
                    "pressable rounded-full border border-border/40 px-2 py-0.5 text-xs backdrop-blur-sm transition-colors",
                    myReactions.has(group.emoji)
                      ? "bg-primary/25 text-primary ring-1 ring-primary/30"
                      : "bg-background/40 text-text-secondary hover:bg-background/60",
                  )}
                >
                  {group.emoji} {group.count}
                </button>
              ))}
            </div>
          )}

          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-1 font-mono text-[10px] tabular-nums",
              isOwn ? "text-on-primary/70" : "text-text-secondary",
            )}
          >
            {message.editedAt && <span>đã sửa · </span>}
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwn && !isDeleted && (
              <span className={cn("ml-0.5", isRead ? "text-on-primary" : "opacity-60")}>
                {isRead ? (
                  <ChecksIcon size={14} weight="bold" aria-label="Đã xem" />
                ) : (
                  <CheckIcon size={14} weight="bold" aria-label="Đã gửi" />
                )}
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
  conversationId: string;
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

const SCROLL_BOTTOM_THRESHOLD = 96;

export function MessageList({
  conversationId,
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
  const contentRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const prevLengthRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    const reduceMotion = document.documentElement.classList.contains("reduce-motion");
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth && !reduceMotion ? "smooth" : "auto",
    });
  }, []);

  const scrollToBottomReliable = useCallback(
    (smooth = false) => {
      scrollToBottom(smooth);
      requestAnimationFrame(() => {
        scrollToBottom(smooth);
        requestAnimationFrame(() => scrollToBottom(smooth));
      });
    },
    [scrollToBottom],
  );

  useEffect(() => {
    isLoadingMoreRef.current = !!isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    stickToBottomRef.current = true;
    prevLengthRef.current = 0;

    if (messages.length === 0) return;

    scrollToBottomReliable(false);
    const t = window.setTimeout(() => scrollToBottomReliable(false), 120);
    return () => window.clearTimeout(t);
  }, [conversationId, scrollToBottomReliable]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current && !isLoadingMoreRef.current) {
        scrollToBottom(false);
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    if (messages.length === 0) return;

    const grew = messages.length > prevLengthRef.current;
    const isInitialBatch = prevLengthRef.current === 0;
    prevLengthRef.current = messages.length;

    if (isLoadingMoreRef.current) return;

    if (!stickToBottomRef.current && !isInitialBatch) return;
    if (!grew && !isInitialBatch) return;

    requestAnimationFrame(() => {
      scrollToBottomReliable(grew && messages.length > 20 && !isInitialBatch);
    });
  }, [messages, scrollToBottomReliable]);

  return (
    <div
      ref={scrollRef}
      className="chat-scroll-region relative z-10 min-h-0 flex-1 px-3 py-4 md:px-6 lg:px-8"
    >
      <div ref={contentRef} className="desktop-thread-stack flex flex-col">
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="pressable mx-auto mb-3 rounded-full border border-border/80 bg-surface-elevated/80 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-surface-elevated disabled:opacity-50"
        >
          {isLoadingMore ? "Đang tải..." : "Tải tin cũ hơn"}
        </button>
      )}

      {messages.map((message, index) => {
        const day = dayLabel(message.createdAt);
        const prev = index > 0 ? messages[index - 1] : null;
        const next = index < messages.length - 1 ? messages[index + 1] : null;
        const showDivider = !prev || dayLabel(prev.createdAt) !== day;
        const isCallMessage = message.contentType === "call";
        const isOwn = message.senderId === currentUserId;

        const isGroupedWithPrev =
          !isCallMessage &&
          prev &&
          prev.contentType !== "call" &&
          prev.senderId === message.senderId &&
          dayLabel(prev.createdAt) === day &&
          !prev.deletedAt &&
          !message.deletedAt;

        const isGroupedWithNext =
          !isCallMessage &&
          next &&
          next.contentType !== "call" &&
          next.senderId === message.senderId &&
          dayLabel(next.createdAt) === day &&
          !next.deletedAt &&
          !message.deletedAt;

        return (
          <div key={message.id}>
            {showDivider && (
              <div className="my-4 flex justify-center">
                <span className="rounded-full bg-foreground/[0.06] px-3 py-1 text-[11px] font-medium text-text-secondary">
                  {day}
                </span>
              </div>
            )}
            {isCallMessage ? (
              <CallBubble message={message} currentUserId={currentUserId} />
            ) : (
              <MessageBubble
                message={message}
                isOwn={isOwn}
                isRead={isMessageRead(message)}
                showSenderName={showSenderNames}
                showTail={!isGroupedWithNext}
                isGrouped={!!isGroupedWithPrev}
                currentUserId={currentUserId}
                onOpenImage={onOpenImage}
                onReply={onReply}
                onReaction={onReaction}
                onPin={onPin}
              />
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
