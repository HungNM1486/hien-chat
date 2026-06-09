"use client";

import { usePathname } from "next/navigation";
import { ThemeMascot } from "@/components/theme/theme-mascot";
import { ThemeTagline } from "@/components/theme/theme-tagline";
import { useTheme } from "@/components/theme/theme-provider";
import type { PresetThemeId } from "@hien-nha/theme";
import { ChatListPanel } from "@/components/chat/chat-list-panel";
import { AppShell } from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

export function ChatSplitLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const match = pathname.match(/^\/chats\/([^/]+)$/);
  const activeId = match?.[1] ?? null;
  const inConversation = !!activeId;
  const isListPage = pathname === "/chats";

  return (
    <AppShell hideBottomNav={inConversation}>
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        <ChatListPanel
          activeId={activeId}
          className={cn(
            inConversation &&
              "hidden w-full flex-col lg:flex lg:shrink-0 chat-list-panel",
          )}
        />

        <div
          className={cn(
            "chat-column flex min-w-0 flex-1 flex-col",
            isListPage && "hidden lg:flex",
            inConversation && "w-full",
          )}
        >
          {isListPage ? (
            <ChatEmptyPane />
          ) : (
            children
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ChatEmptyPane() {
  const { activeTheme } = useTheme();

  return (
    <div className="chat-thread-bg flex h-full flex-col items-center justify-center px-8 text-center lg:px-12">
      <div className="relative z-10 flex max-w-md flex-col items-center gap-5">
        <div className="theme-mascot-frame flex h-28 w-28 items-center justify-center overflow-hidden lg:h-32 lg:w-32">
          <ThemeMascot themeId={activeTheme.id as PresetThemeId} size={96} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary lg:text-2xl">
            Chọn cuộc trò chuyện
          </h2>
          <p className="mx-auto mt-2 max-w-[320px] text-sm leading-relaxed text-text-secondary lg:text-[15px]">
            Chọn từ danh sách bên trái hoặc bắt đầu cuộc trò chuyện mới
          </p>
          <ThemeTagline themeId={activeTheme.id} className="mx-auto mt-3 max-w-[300px]" />
        </div>
      </div>
    </div>
  );
}
