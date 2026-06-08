"use client";

import type { MessagePublic } from "@hien-nha/shared";

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
        className="absolute rounded-2xl border border-border bg-surface p-2 shadow-lg"
        style={{
          left: Math.min(position.x, window.innerWidth - 220),
          top: Math.min(position.y, window.innerHeight - 120),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-xl active:bg-white/10"
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
          className="flex w-full rounded-xl px-4 py-3 text-left text-sm active:bg-white/5"
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
            className="flex w-full rounded-xl px-4 py-3 text-left text-sm active:bg-white/5"
            onClick={() => {
              onPin(message);
              onClose();
            }}
          >
            Ghim tin
          </button>
        )}
      </div>
    </div>
  );
}
