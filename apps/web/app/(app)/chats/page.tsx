"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
import { ConversationList } from "@/components/chat/conversation-list";
import { NewChatSheet } from "@/components/chat/new-chat-sheet";
import { fetchConversations } from "@/lib/chat-api";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";

export default function ChatsPage() {
  const router = useRouter();
  const conversations = useChatStore((s) => s.conversations);
  const isLoading = useChatStore((s) => s.isLoadingConversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const setLoading = useChatStore((s) => s.setLoadingConversations);

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchConversations()
      .then(setConversations)
      .finally(() => setLoading(false));
  }, [setConversations, setLoading]);

  const filtered = conversations.filter((c) =>
    c.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <AppShell
        header={
          <AppHeader
            title="Hiên nhà"
            right={
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center text-xl text-primary"
                  aria-label="Cuộc trò chuyện mới"
                >
                  +
                </button>
                <Link
                  href="/settings"
                  className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center text-lg md:hidden"
                  aria-label="Cài đặt"
                >
                  ⚙️
                </Link>
              </div>
            }
          />
        }
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm cuộc trò chuyện..."
              className="flex min-h-[var(--touch-target)] w-full rounded-xl border border-border bg-background px-4 text-text-primary outline-none focus:border-primary"
            />
          </div>

          {!isLoading && filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl">
                💬
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {search ? "Không tìm thấy" : "Chưa có cuộc trò chuyện"}
                </h2>
                <p className="mt-2 text-sm text-text-secondary">
                  {search
                    ? "Thử từ khóa khác"
                    : "Bắt đầu nhắn tin với người thân của bạn"}
                </p>
              </div>
              {!search && (
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="flex min-h-[var(--touch-target)] items-center justify-center rounded-xl bg-primary px-6 font-semibold text-on-primary"
                >
                  + Cuộc trò chuyện mới
                </button>
              )}
            </div>
          ) : (
            <ConversationList conversations={filtered} isLoading={isLoading} />
          )}
        </div>
      </AppShell>

      <NewChatSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={(id) => router.push(`/chats/${id}`)}
      />
    </>
  );
}
