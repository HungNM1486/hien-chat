"use client";

import { useEffect, useState } from "react";
import type { UserPublic } from "@hien-nha/shared";
import {
  fetchUsers,
  createDirectConversation,
  createGroupConversation,
} from "@/lib/chat-api";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";

type Tab = "direct" | "group";

interface NewChatSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function NewChatSheet({ open, onClose, onCreated }: NewChatSheetProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("direct");
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const upsertConversation = useChatStore((s) => s.upsertConversation);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setTab("direct");
    setGroupName("");
    setSelectedIds(new Set());
    setSearch("");
    fetchUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = users.filter(
    (u) =>
      u.id !== currentUser?.id &&
      (u.displayName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );

  const handleDirectSelect = async (user: UserPublic) => {
    setCreating(true);
    try {
      const conversation = await createDirectConversation(user.id);
      upsertConversation(conversation);
      onCreated(conversation.id);
      onClose();
    } finally {
      setCreating(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedIds.size === 0 || creating) return;
    setCreating(true);
    try {
      const conversation = await createGroupConversation(
        groupName.trim(),
        Array.from(selectedIds),
      );
      upsertConversation(conversation);
      onCreated(conversation.id);
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Đóng"
      />
      <div
        className="relative max-h-[80vh] rounded-t-2xl bg-surface pb-[var(--safe-area-bottom)]"
        style={{ paddingBottom: "max(16px, var(--safe-area-bottom))" }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h2 className="text-lg font-semibold">Cuộc trò chuyện mới</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center text-text-secondary"
          >
            ✕
          </button>
        </div>

        <div className="flex border-b border-border">
          {(["direct", "group"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-3 text-sm font-medium",
                tab === t
                  ? "border-b-2 border-primary text-primary"
                  : "text-text-secondary",
              )}
            >
              {t === "direct" ? "1-1" : "Nhóm"}
            </button>
          ))}
        </div>

        {tab === "group" && (
          <div className="border-b border-border px-4 py-3">
            <input
              type="text"
              placeholder="Tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary outline-none focus:border-primary"
            />
          </div>
        )}

        <div className="px-4 py-3">
          <input
            type="search"
            placeholder="Tìm người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary outline-none focus:border-primary"
          />
        </div>

        <div className="max-h-[40vh] overflow-y-auto">
          {loading ? (
            <p className="px-4 py-8 text-center text-text-secondary">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-text-secondary">
              Không tìm thấy người dùng
            </p>
          ) : tab === "direct" ? (
            filtered.map((user) => (
              <button
                key={user.id}
                type="button"
                disabled={creating}
                onClick={() => handleDirectSelect(user)}
                className={cn(
                  "flex w-full min-h-[var(--touch-target)] items-center gap-3 px-4 py-3 text-left transition-colors active:bg-white/5",
                  creating && "opacity-50",
                )}
              >
                <UserRow user={user} />
              </button>
            ))
          ) : (
            filtered.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleMember(user.id)}
                className="flex w-full min-h-[var(--touch-target)] items-center gap-3 px-4 py-3 text-left active:bg-white/5"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                    selectedIds.has(user.id)
                      ? "border-primary bg-primary text-on-primary"
                      : "border-border",
                  )}
                >
                  {selectedIds.has(user.id) ? "✓" : ""}
                </span>
                <UserRow user={user} />
              </button>
            ))
          )}
        </div>

        {tab === "group" && (
          <div className="border-t border-border px-4 py-3">
            <button
              type="button"
              disabled={
                creating || !groupName.trim() || selectedIds.size === 0
              }
              onClick={handleCreateGroup}
              className="w-full rounded-xl bg-primary py-3 font-medium text-on-primary disabled:opacity-40"
            >
              {creating
                ? "Đang tạo..."
                : `Tạo nhóm (${selectedIds.size} thành viên)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user }: { user: UserPublic }) {
  return (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
        {user.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-text-primary">{user.displayName}</p>
        <p className="truncate text-sm text-text-secondary">{user.email}</p>
      </div>
    </>
  );
}
