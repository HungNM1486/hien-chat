"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PlusIcon } from "@phosphor-icons/react";
import { ThemeMascot } from "@/components/theme/theme-mascot";
import { ThemeTagline } from "@/components/theme/theme-tagline";
import { useTheme } from "@/components/theme/theme-provider";
import type { PresetThemeId } from "@hien-nha/theme";
import { ChatListPanel } from "@/components/chat/chat-list-panel";
import { AppShell } from "@/components/layout/app-shell";
import { useIsDesktopSplit } from "@/hooks/use-media-query";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";

export function ChatSplitLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useIsDesktopSplit();
  const match = pathname.match(/^\/chats\/([^/]+)$/);
  const activeId = match?.[1] ?? null;
  const inConversation = !!activeId;
  const isListPage = pathname === "/chats";
  const [newChatOpen, setNewChatOpen] = useState(false);

  const conversations = useChatStore((s) => s.conversations);
  const isLoadingConversations = useChatStore((s) => s.isLoadingConversations);

  useEffect(() => {
    if (!isDesktop || !isListPage || isLoadingConversations || conversations.length === 0) {
      return;
    }
    router.replace(`/chats/${conversations[0].id}`);
  }, [isDesktop, isListPage, isLoadingConversations, conversations, router]);

  return (
    <AppShell hideBottomNav={inConversation}>
      <div className="chat-shell-row">
        <ChatListPanel
          activeId={activeId}
          newChatOpen={newChatOpen}
          onNewChatOpenChange={setNewChatOpen}
          className={cn(
            "flex min-h-0 flex-col",
            inConversation ? "hidden lg:flex" : "flex",
          )}
        />

        <div
          className={cn(
            "desktop-chat-thread chat-column",
            isListPage && "hidden lg:flex",
            inConversation && "flex w-full",
          )}
        >
          {isListPage ? (
            <ChatEmptyPane onNewChat={() => setNewChatOpen(true)} />
          ) : (
            children
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ChatEmptyPane({ onNewChat }: { onNewChat: () => void }) {
  const { activeTheme } = useTheme();

  return (
    <div className="chat-thread-bg flex h-full min-h-0 flex-1 flex-col items-center justify-center px-8 text-center lg:px-12">
      <div className="relative z-10 flex max-w-md flex-col items-center gap-5">
        <div className="theme-mascot-frame flex h-28 w-28 items-center justify-center overflow-hidden lg:h-32 lg:w-32">
          <ThemeMascot themeId={activeTheme.id as PresetThemeId} size={96} />
        </div>
        <div>
          <h2 className="text-balance text-xl font-bold tracking-tight text-text-primary lg:text-2xl">
            Chọn cuộc trò chuyện
          </h2>
          <p className="mx-auto mt-2 max-w-[320px] text-sm leading-relaxed text-text-secondary lg:text-[15px]">
            Chọn từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới
          </p>
          <ThemeTagline themeId={activeTheme.id} className="mx-auto mt-3 max-w-[300px]" />
        </div>
        <button type="button" onClick={onNewChat} className="btn-primary gap-2 px-5">
          <PlusIcon size={18} weight="bold" aria-hidden />
          Cuộc trò chuyện mới
        </button>
      </div>
    </div>
  );
}
