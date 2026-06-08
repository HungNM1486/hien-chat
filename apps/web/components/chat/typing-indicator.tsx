"use client";

import { useChatStore } from "@/stores/chat-store";
import { useAuthStore } from "@/stores/auth-store";

interface TypingIndicatorProps {
  conversationId: string;
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const user = useAuthStore((s) => s.user);
  const typingUsers = useChatStore(
    (s) => s.typingByConversation[conversationId] ?? [],
  );
  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === conversationId),
  );

  const others = typingUsers.filter((id) => id !== user?.id);
  if (others.length === 0) return null;

  let label = "Đang nhập...";
  if (conversation?.type === "direct" && conversation.otherUserId) {
    label = `${conversation.displayName} đang nhập...`;
  }

  return (
    <div className="px-4 pb-2 text-sm text-text-secondary">
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="animate-pulse">●●●</span>
      </span>
    </div>
  );
}
