"use client";

import { useEffect, useRef, useState } from "react";
import type { MessagePublic } from "@hien-nha/shared";
import { ReplyPreview } from "@/components/chat/reply-preview";
import { VoiceRecorder } from "@/components/chat/voice-recorder";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  onSend: (content: string) => void;
  onSendImage?: (file: File) => void;
  onSendVoice?: (blob: Blob, duration: number) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: MessagePublic | null;
  onCancelReply?: () => void;
  uploadProgress?: number | null;
}

export function MessageComposer({
  onSend,
  onSendImage,
  onSendVoice,
  onTyping,
  disabled,
  placeholder = "Nhập tin nhắn...",
  replyTo,
  onCancelReply,
  uploadProgress,
}: MessageComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      document.documentElement.style.setProperty(
        "--keyboard-offset",
        `${Math.max(0, offset)}px`,
      );
    };

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
      document.documentElement.style.setProperty("--keyboard-offset", "0px");
    };
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    onTyping?.();

    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendImage) {
      onSendImage(file);
    }
    e.target.value = "";
  };

  return (
    <div
      className="shrink-0 border-t border-border bg-surface px-3 py-2"
      style={{
        paddingBottom:
          "max(8px, calc(var(--safe-area-bottom) + var(--keyboard-offset, 0px)))",
      }}
    >
      {replyTo && (
        <div className="mb-2 flex items-start gap-2 rounded-xl bg-background px-3 py-2">
          <div className="min-w-0 flex-1">
            <ReplyPreview message={replyTo} />
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 px-2 text-text-secondary"
            aria-label="Hủy trả lời"
          >
            ✕
          </button>
        </div>
      )}

      {uploadProgress != null && (
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          disabled={disabled || !onSendImage}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex h-[var(--composer-min-height)] w-10 shrink-0 items-center justify-center rounded-full text-lg",
            disabled && "opacity-40",
          )}
          aria-label="Gửi ảnh"
        >
          📷
        </button>

        {onSendVoice && (
          <VoiceRecorder onRecorded={onSendVoice} disabled={disabled} />
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={placeholder}
          className="max-h-[120px] min-h-[var(--composer-min-height)] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-text-primary outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="flex h-[var(--composer-min-height)] w-[var(--composer-min-height)] shrink-0 items-center justify-center rounded-full bg-primary text-lg text-on-primary disabled:opacity-40"
          aria-label="Gửi"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
