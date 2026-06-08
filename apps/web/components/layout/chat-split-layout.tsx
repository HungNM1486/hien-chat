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
              "hidden w-full flex-col xl:flex xl:w-[340px] xl:shrink-0",
          )}
        />

        <div
          className={cn(
            "chat-column flex min-w-0 flex-1 flex-col",
            isListPage && "hidden xl:flex",
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
    <div className="chat-thread-bg flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="theme-mascot-frame relative z-10 flex h-28 w-28 items-center justify-center overflow-hidden">
        <ThemeMascot themeId={activeTheme.id as PresetThemeId} size={96} />
      </div>
      <div className="relative z-10">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">
          Chọn cuộc trò chuyện
        </h2>
        <ThemeTagline themeId={activeTheme.id} className="mx-auto mt-2 max-w-[280px]" />
      </div>
    </div>
  );
}
