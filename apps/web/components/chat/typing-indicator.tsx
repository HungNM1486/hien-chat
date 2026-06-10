"use client";

import { useChatStore, EMPTY_TYPING_USERS } from "@/stores/chat-store";
import { useAuthStore } from "@/stores/auth-store";

interface TypingIndicatorProps {
  conversationId: string;
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const user = useAuthStore((s) => s.user);
  const typingUsers = useChatStore(
    (s) => s.typingByConversation[conversationId] ?? EMPTY_TYPING_USERS,
  );
  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === conversationId),
  );

  const others = typingUsers.filter((id) => id !== user?.id);
  if (others.length === 0) return null;

  let label = "Đang nhập";
  if (conversation?.type === "direct" && conversation.otherUserId) {
    label = `${conversation.displayName} đang nhập`;
  }

  return (
    <div
      className="shrink-0 px-3 pb-1 pt-0 lg:px-8"
      role="status"
      aria-live="polite"
    >
      <div className="desktop-thread-stack">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-border/50 bg-bubble-received/90 px-3 py-2 text-sm text-text-secondary shadow-sm backdrop-blur-sm">
        <span>{label}</span>
        <span className="inline-flex items-center gap-0.5" aria-hidden>
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
      </div>
      </div>
    </div>
  );
}
