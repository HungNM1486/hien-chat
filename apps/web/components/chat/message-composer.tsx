"use client";

import { useEffect, useRef, useState } from "react";
import type { MessagePublic } from "@hien-nha/shared";
import {
  CameraIcon,
  MicrophoneIcon,
  PaperPlaneRightIcon,
  XIcon,
} from "@phosphor-icons/react";
import { ReplyPreview } from "@/components/chat/reply-preview";
import { VoiceRecorder } from "@/components/chat/voice-recorder";
import { IconButton } from "@/components/ui/icon-button";
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

  const canSend = value.trim().length > 0;

  return (
    <div
      className="chat-column-footer glass-panel border-t px-3 pt-2 lg:px-6 lg:pt-3"
      style={{
        paddingBottom:
          "max(10px, calc(var(--safe-area-bottom) + var(--keyboard-offset, 0px)))",
      }}
    >
      {replyTo && (
        <div className="mb-2 flex items-start gap-2 rounded-xl border border-border/60 bg-surface/80 px-3 py-2">
          <div className="min-w-0 flex-1 border-l-2 border-primary pl-2.5">
            <ReplyPreview message={replyTo} compact />
          </div>
          <IconButton
            icon={XIcon}
            size="sm"
            label="Hủy trả lời"
            onClick={onCancelReply}
            className="text-text-secondary"
          />
        </div>
      )}

      {uploadProgress != null && (
        <div className="mb-2 h-0.5 overflow-hidden rounded-full bg-border/70">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="desktop-thread-stack px-0 pb-1 lg:px-2">
        <div className="flex w-full max-w-full items-end gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            icon={CameraIcon}
            size="sm"
            disabled={disabled || !onSendImage}
            label="Gửi ảnh"
            onClick={() => fileInputRef.current?.click()}
            className="text-text-secondary"
          />

          {onSendVoice ? (
            <VoiceRecorder onRecorded={onSendVoice} disabled={disabled} />
          ) : (
            <IconButton
              icon={MicrophoneIcon}
              size="sm"
              disabled
              label="Ghi âm"
              className="text-text-secondary"
            />
          )}
        </div>

        <div className="relative min-w-0 flex-1 basis-0">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder={placeholder}
            className={cn(
              "block max-h-[120px] min-h-[var(--composer-min-height)] w-full min-w-0 resize-none rounded-[22px]",
              "border border-border/70 bg-surface px-3 py-2.5 text-[length:var(--font-size-base)] text-text-primary",
              "outline-none transition-[border-color,box-shadow] placeholder:text-text-secondary/60",
              "focus:border-primary/40 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_10%,transparent)]",
            )}
          />
        </div>

        <IconButton
          icon={PaperPlaneRightIcon}
          iconWeight="fill"
          size="sm"
          variant="primary"
          label="Gửi"
          onClick={handleSubmit}
          disabled={disabled || !canSend}
          className={cn(
            "shrink-0 transition-all duration-200",
            canSend ? "scale-100 opacity-100" : "scale-90 opacity-35",
          )}
        />
        </div>
      </div>
    </div>
  );
}
