"use client";

import { useEffect, useState } from "react";
import type { UserPublic } from "@hien-nha/shared";
import { CheckIcon, MagnifyingGlassIcon, UsersThreeIcon, UserIcon } from "@phosphor-icons/react";
import {
  fetchUsers,
  createDirectConversation,
  createGroupConversation,
} from "@/lib/chat-api";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { UserAvatar } from "@/components/ui/user-avatar";
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
    fetchUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [open]);

  const handleClose = () => {
    setTab("direct");
    setGroupName("");
    setSelectedIds(new Set());
    setSearch("");
    setLoading(true);
    onClose();
  };

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
      handleClose();
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
      handleClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Cuộc trò chuyện mới"
      subtitle={tab === "direct" ? "Chọn người để nhắn 1-1" : "Tạo nhóm với người thân"}
      footer={
        tab === "group" ? (
          <button
            type="button"
            disabled={creating || !groupName.trim() || selectedIds.size === 0}
            onClick={handleCreateGroup}
            className="btn-primary w-full"
          >
            {creating
              ? "Đang tạo..."
              : `Tạo nhóm (${selectedIds.size} thành viên)`}
          </button>
        ) : undefined
      }
    >
      <div className="px-5 pb-4">
        <div className="tab-pill-group mb-4">
          {(["direct", "group"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn("tab-pill flex items-center justify-center gap-1.5", tab === t && "tab-pill-active")}
            >
              {t === "direct" ? (
                <UserIcon size={16} aria-hidden />
              ) : (
                <UsersThreeIcon size={16} aria-hidden />
              )}
              {t === "direct" ? "1-1" : "Nhóm"}
            </button>
          ))}
        </div>

        {tab === "group" && (
          <input
            type="text"
            placeholder="Tên nhóm..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="input-field mb-3"
          />
        )}

        <div className="relative mb-3">
          <MagnifyingGlassIcon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Tìm người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="max-h-[42vh] overflow-y-auto px-2">
        {loading ? (
          <div className="space-y-2 px-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2">
                <div className="h-10 w-10 animate-pulse rounded-[14px] bg-surface-elevated" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 animate-pulse rounded bg-surface-elevated" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-surface-elevated/70" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-text-secondary">
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
                "pressable flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-foreground/[0.04]",
                creating && "opacity-50",
              )}
            >
              <UserRow user={user} />
            </button>
          ))
        ) : (
          filtered.map((user) => {
            const selected = selectedIds.has(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleMember(user.id)}
                className="pressable flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-foreground/[0.04]"
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors",
                    selected
                      ? "border-primary bg-primary text-on-primary"
                      : "border-border bg-background/40",
                  )}
                >
                  {selected && <CheckIcon size={14} weight="bold" aria-hidden />}
                </span>
                <UserRow user={user} />
              </button>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
}

function UserRow({ user }: { user: UserPublic }) {
  return (
    <>
      <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} size="sm" ring />
      <div className="min-w-0">
        <p className="truncate font-medium text-text-primary">{user.displayName}</p>
        <p className="truncate text-sm text-text-secondary">{user.email}</p>
      </div>
    </>
  );
}
