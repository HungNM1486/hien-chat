"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DotsThreeVerticalIcon,
  PhoneIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { AppHeader } from "@/components/layout/app-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageComposer } from "@/components/chat/message-composer";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatSettingsSheet } from "@/components/chat/chat-settings-sheet";
import { GroupInfoSheet } from "@/components/chat/group-info-sheet";
import { ImageLightbox } from "@/components/chat/image-lightbox";
import { ConversationTheme } from "@/components/theme/conversation-theme";
import { IconButton } from "@/components/ui/icon-button";
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { pinMessage } from "@/lib/e2e-api";
import { toast } from "@/stores/toast-store";
import { useCall } from "@/contexts/call-context";
import { useCallStore } from "@/stores/call-store";
import { useIsDesktopSplit } from "@/hooks/use-media-query";
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
  const isDesktopSplit = useIsDesktopSplit();

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

  const { startCall } = useCall();
  const callStatus = useCallStore((s) => s.status);
  const inCall = callStatus !== "idle" && callStatus !== "ended";

  const isGroup = conversation?.type === "group";
  const statusLabel = isGroup
    ? `${conversation?.memberCount ?? conversation?.members.length ?? 0} thành viên`
    : otherUserOnline
      ? "Đang hoạt động"
      : "Offline";

  const headerSubtitle = [
    !isGroup && otherUserOnline ? "Đang hoạt động" : !isGroup ? "Offline" : statusLabel,
    conversation?.encryptionMode === "e2e" ? "Mã hóa E2E" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (isLoading || !user) {
    return (
      <div className="desktop-chat-thread chat-column flex h-full min-h-0 flex-1 flex-col page-slide-in">
        <AppHeader title="..." backHref={isDesktopSplit ? undefined : "/chats"} />
        <div className="chat-scroll-region chat-thread-bg flex min-h-0 flex-1 flex-col gap-2.5 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "h-11 skeleton-shimmer rounded-2xl",
                i % 2 === 0 ? "ml-auto w-2/3" : "w-2/3",
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="desktop-chat-thread chat-column flex h-full min-h-0 flex-1 flex-col page-slide-in">
        <AppHeader
          title={conversation?.displayName ?? "Chat"}
          subtitle={headerSubtitle}
          backHref={isDesktopSplit ? undefined : "/chats"}
          onTitleClick={isGroup ? () => setGroupInfoOpen(true) : undefined}
          right={
            <div className="flex items-center">
              {isGroup && (
                <IconButton
                  icon={UsersIcon}
                  label="Thông tin nhóm"
                  onClick={() => setGroupInfoOpen(true)}
                />
              )}
              {!isGroup && (
                <IconButton
                  icon={PhoneIcon}
                  iconWeight="fill"
                  label="Gọi thoại"
                  disabled={inCall}
                  onClick={() =>
                    startCall(id, conversation?.displayName ?? "Chat")
                  }
                />
              )}
              <IconButton
                icon={DotsThreeVerticalIcon}
                iconWeight="bold"
                label="Cài đặt cuộc trò chuyện"
                onClick={() => setSettingsOpen(true)}
              />
            </div>
          }
        />

        <ConversationTheme
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden chat-thread-bg"
          themeOverride={conversation?.settings?.themeOverride}
          wallpaperUrl={conversation?.settings?.wallpaperUrl}
        >
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <MessageList
              conversationId={id}
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

            <TypingIndicator conversationId={id} />
          </div>

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
      </div>

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
