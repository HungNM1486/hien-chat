"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { ConversationList } from "@/components/chat/conversation-list";
import { ThemeMascot } from "@/components/theme/theme-mascot";
import { NewChatSheet } from "@/components/chat/new-chat-sheet";
import { IconButton } from "@/components/ui/icon-button";
import { fetchConversations } from "@/lib/chat-api";
import { useChatStore } from "@/stores/chat-store";
import { useTheme } from "@/components/theme/theme-provider";
import { getThemeIdentity } from "@hien-nha/theme";
import type { PresetThemeId } from "@hien-nha/theme";
import { cn } from "@/lib/utils";

interface ChatListPanelProps {
  activeId?: string | null;
  className?: string;
  newChatOpen?: boolean;
  onNewChatOpenChange?: (open: boolean) => void;
}

export function ChatListPanel({
  activeId,
  className,
  newChatOpen: controlledOpen,
  onNewChatOpenChange,
}: ChatListPanelProps) {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const identity = getThemeIdentity(activeTheme.id);
  const conversations = useChatStore((s) => s.conversations);
  const isLoading = useChatStore((s) => s.isLoadingConversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const setLoading = useChatStore((s) => s.setLoadingConversations);

  const [search, setSearch] = useState("");
  const [internalOpen, setInternalOpen] = useState(false);
  const sheetOpen = controlledOpen ?? internalOpen;
  const setSheetOpen = onNewChatOpenChange ?? setInternalOpen;

  useEffect(() => {
    setLoading(true);
    fetchConversations()
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [setConversations, setLoading]);

  const filtered = conversations.filter((c) =>
    c.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const showEmpty = !isLoading && filtered.length === 0;
  const showRefreshing = isLoading && filtered.length > 0;

  return (
    <>
      <div
        className={cn(
          "chat-column chat-list-panel flex min-h-0 flex-col lg:border-r lg:border-border/60",
          className,
        )}
      >
        <header className="chat-column-header px-4 pb-3 pt-[calc(var(--safe-area-top)+12px)] lg:px-5 lg:pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-balance truncate text-[22px] font-bold tracking-tight text-text-primary lg:text-2xl">
                Tin nhắn
              </h1>
              {identity && (
                <p className="mt-0.5 truncate text-[13px] text-text-secondary lg:hidden">
                  <span aria-hidden>{identity.emoji} </span>
                  {activeTheme.name}
                </p>
              )}
            </div>
            <IconButton
              icon={PlusIcon}
              iconWeight="bold"
              variant="soft"
              size="sm"
              label="Cuộc trò chuyện mới"
              onClick={() => setSheetOpen(true)}
            />
          </div>

          <div className="relative mt-3">
            <MagnifyingGlassIcon
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm cuộc trò chuyện..."
              className="search-field"
              aria-label="Tìm cuộc trò chuyện"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="pressable absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary hover:bg-foreground/[0.05] hover:text-text-primary"
                aria-label="Xóa tìm kiếm"
              >
                <XIcon size={16} aria-hidden />
              </button>
            )}
          </div>
        </header>

        <div className="chat-scroll-region chat-list-scroll flex min-h-0 flex-1 flex-col">
          {showRefreshing && (
            <div className="shrink-0 border-b border-border/40 bg-primary/[0.06] px-4 py-1.5 text-center text-[11px] font-medium text-primary lg:px-5">
              Đang cập nhật...
            </div>
          )}
          {showEmpty ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 px-8 py-10 text-center">
              <div className="theme-mascot-frame flex h-20 w-20 items-center justify-center overflow-hidden">
                <ThemeMascot themeId={activeTheme.id as PresetThemeId} size={68} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {search ? "Không tìm thấy" : "Chưa có cuộc trò chuyện"}
                </h2>
                <p className="mt-1.5 max-w-[240px] text-sm leading-relaxed text-text-secondary">
                  {search
                    ? "Thử từ khóa khác hoặc tạo cuộc trò chuyện mới"
                    : "Bắt đầu nhắn tin với người thân"}
                </p>
              </div>
              {!search && (
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="btn-primary gap-2 px-5"
                >
                  <PlusIcon size={18} weight="bold" aria-hidden />
                  Cuộc trò chuyện mới
                </button>
              )}
            </div>
          ) : (
            <ConversationList
              conversations={filtered}
              isLoading={isLoading && filtered.length === 0}
              activeId={activeId}
            />
          )}
        </div>
      </div>

      <NewChatSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={(id) => router.push(`/chats/${id}`)}
      />
    </>
  );
}
