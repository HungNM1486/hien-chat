"use client";

import { getMessagePreview, type MessagePublic } from "@hien-nha/shared";
import { cn } from "@/lib/utils";

interface ReplyPreviewProps {
  message: Pick<MessagePublic, "content" | "contentType" | "sender">;
  compact?: boolean;
  className?: string;
}

export function ReplyPreview({ message, compact, className }: ReplyPreviewProps) {
  return (
    <div
      className={cn(
        "border-l-2 border-primary/60 pl-2",
        compact ? "text-xs" : "text-sm",
        className,
      )}
    >
      <p className="font-semibold text-primary">
        {message.sender?.displayName ?? "Người gửi"}
      </p>
      <p className="truncate text-text-secondary">
        {getMessagePreview(message as MessagePublic)}
      </p>
    </div>
  );
}
