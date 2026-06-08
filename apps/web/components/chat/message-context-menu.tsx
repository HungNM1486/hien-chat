"use client";

import type { MessagePublic } from "@hien-nha/shared";
import { PushPinIcon } from "@phosphor-icons/react";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢"];

interface MessageContextMenuProps {
  message: MessagePublic;
  open: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onReply: (message: MessagePublic) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onPin?: (message: MessagePublic) => void;
}

export function MessageContextMenu({
  message,
  open,
  position,
  onClose,
  onReply,
  onReaction,
  onPin,
}: MessageContextMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]" onClick={onClose}>
      <div
        className="absolute min-w-[200px] overflow-hidden rounded-2xl border border-border/70 bg-surface-elevated/95 p-2 shadow-[0_16px_48px_rgb(var(--shadow-color)/0.35)] backdrop-blur-xl"
        style={{
          left: Math.min(position.x, window.innerWidth - 220),
          top: Math.min(position.y, window.innerHeight - 140),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex justify-center gap-0.5 rounded-xl bg-background/40 p-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="pressable flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-colors hover:bg-foreground/5"
              onClick={() => {
                onReaction(message.id, emoji);
                onClose();
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="pressable flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-foreground/5"
          onClick={() => {
            onReply(message);
            onClose();
          }}
        >
          Trả lời
        </button>
        {onPin && (
          <button
            type="button"
            className="pressable flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-foreground/5"
            onClick={() => {
              onPin(message);
              onClose();
            }}
          >
            <PushPinIcon size={16} aria-hidden />
            Ghim tin
          </button>
        )}
      </div>
    </div>
  );
}
