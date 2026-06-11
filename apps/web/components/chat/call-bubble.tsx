"use client";

import {
  getCallLabel,
  parseCallContent,
  type MessagePublic,
} from "@hien-nha/shared";
import {
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
  PhoneXIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CallBubbleProps {
  message: MessagePublic;
  currentUserId: string;
}

export function CallBubble({ message, currentUserId }: CallBubbleProps) {
  const call = parseCallContent(message.content);
  if (!call) {
    return (
      <div className="my-2 flex justify-center">
        <span className="text-xs text-text-secondary">Cuộc gọi</span>
      </div>
    );
  }

  const { label, sublabel, missed } = getCallLabel(call, currentUserId);
  const isCaller = currentUserId === call.callerId;
  const Icon =
    call.outcome === "busy" || missed
      ? PhoneXIcon
      : isCaller
        ? PhoneOutgoingIcon
        : PhoneIncomingIcon;

  return (
    <div className="my-3 flex justify-center px-2">
      <div
        className={cn(
          "inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border px-4 py-2.5 text-sm shadow-sm",
          missed
            ? "border-accent/25 bg-accent/[0.07] text-accent"
            : "border-border/50 bg-surface-elevated/90 text-text-secondary",
        )}
      >
        <Icon
          size={18}
          weight="duotone"
          className={cn("shrink-0", missed ? "text-accent" : "text-primary")}
          aria-hidden
        />
        <span
          className={cn(
            "font-medium",
            missed ? "text-accent" : "text-text-primary",
          )}
        >
          {label}
        </span>
        {sublabel && (
          <span className="font-mono text-xs tabular-nums opacity-80">
            {sublabel}
          </span>
        )}
        <span className="text-[10px] opacity-60">
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
