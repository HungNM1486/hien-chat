"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageComposer } from "@/components/chat/message-composer";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatSettingsSheet } from "@/components/chat/chat-settings-sheet";
import { GroupInfoSheet } from "@/components/chat/group-info-sheet";
import { ImageLightbox } from "@/components/chat/image-lightbox";
import { ConversationTheme } from "@/components/theme/conversation-theme";
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { pinMessage } from "@/lib/e2e-api";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const {
    conversation,
    messages,
    otherUserOnline,
    isLoading,
    isLoadingMore,
    hasMore,
    isSending,
    uploadProgress,
    replyTo,
    setReplyTo,
    loadMore,
    sendMessage,
    sendImage,
    sendVoice,
    toggleReaction,
    notifyTyping,
    isMessageRead,
  } = useChat(id);

  const isGroup = conversation?.type === "group";
  const statusLabel = isGroup
    ? `${conversation?.memberCount ?? conversation?.members.length ?? 0} thành viên`
    : otherUserOnline
      ? "Đang hoạt động"
      : "Offline";

  if (isLoading || !user) {
    return (
      <AppShell hideBottomNav header={<AppHeader title="..." backHref="/chats" />}>
        <div className="flex flex-1 flex-col gap-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "h-12 animate-pulse rounded-2xl bg-surface",
                i % 2 === 0 ? "ml-auto w-2/3" : "w-2/3",
              )}
            />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <AppShell
        hideBottomNav
        className="page-slide-in"
        header={
          <AppHeader
            title={conversation?.displayName ?? "Chat"}
            backHref="/chats"
            onTitleClick={isGroup ? () => setGroupInfoOpen(true) : undefined}
            right={
              <div className="flex items-center">
                {isGroup && (
                  <button
                    type="button"
                    onClick={() => setGroupInfoOpen(true)}
                    className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center text-lg"
                    aria-label="Thông tin nhóm"
                  >
                    👥
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center text-lg"
                  aria-label="Cài đặt cuộc trò chuyện"
                >
                  ⋮
                </button>
              </div>
            }
          />
        }
      >
        <ConversationTheme
          className="flex flex-1 flex-col overflow-hidden"
          themeOverride={conversation?.settings?.themeOverride}
          wallpaperUrl={conversation?.settings?.wallpaperUrl}
        >
          <div className="border-b border-border px-4 py-1.5">
            <p className="text-xs text-text-secondary">
              {!isGroup && (
                <span
                  className={cn(
                    "mr-1.5 inline-block h-2 w-2 rounded-full",
                    otherUserOnline ? "bg-green-500" : "bg-text-secondary",
                  )}
                />
              )}
              {statusLabel}
              {conversation?.encryptionMode === "e2e" && " · 🔒 E2E"}
            </p>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <MessageList
              messages={messages}
              currentUserId={user.id}
              isMessageRead={isMessageRead}
              showSenderNames={isGroup}
              onLoadMore={loadMore}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onOpenImage={setLightboxUrl}
              onReply={setReplyTo}
              onReaction={toggleReaction}
              onPin={(msg) => {
                void pinMessage(id, msg.id).then(() =>
                  toast("Đã ghim tin", "success"),
                );
              }}
            />
          </div>

          <TypingIndicator conversationId={id} />
          <MessageComposer
            onSend={sendMessage}
            onSendImage={sendImage}
            onSendVoice={sendVoice}
            onTyping={notifyTyping}
            disabled={isSending}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            uploadProgress={uploadProgress}
          />
        </ConversationTheme>
      </AppShell>

      <ChatSettingsSheet
        open={settingsOpen}
        conversation={conversation}
        onClose={() => setSettingsOpen(false)}
      />

      <GroupInfoSheet
        open={groupInfoOpen}
        conversation={conversation}
        onClose={() => {
          setGroupInfoOpen(false);
          if (!useChatStore.getState().conversations.some((c) => c.id === id)) {
            router.push("/chats");
          }
        }}
      />

      <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </>
  );
}
