"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ConversationPublic } from "@hien-nha/shared";
import {
  addGroupMember,
  createInvite,
  fetchUsers,
  leaveGroup,
} from "@/lib/chat-api";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

interface GroupInfoSheetProps {
  open: boolean;
  conversation: ConversationPublic | undefined;
  onClose: () => void;
}

export function GroupInfoSheet({
  open,
  conversation,
  onClose,
}: GroupInfoSheetProps) {
  const user = useAuthStore((s) => s.user);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [users, setUsers] = useState<
    { id: string; displayName: string; email: string }[]
  >([]);
  const [adding, setAdding] = useState<string | null>(null);

  const myRole =
    conversation?.members.find((m) => m.userId === user?.id)?.role ?? "member";
  const isAdmin = myRole === "admin";

  useEffect(() => {
    if (!open) {
      setShowAddMember(false);
      setInviteLink(null);
    }
  }, [open]);

  useEffect(() => {
    if (!showAddMember) return;
    fetchUsers().then(setUsers);
  }, [showAddMember]);

  if (!open || !conversation || conversation.type !== "group") return null;

  const memberIds = new Set(conversation.members.map((m) => m.userId));
  const addableUsers = users.filter((u) => !memberIds.has(u.id));

  const handleCreateInvite = async () => {
    setLoadingInvite(true);
    try {
      const invite = await createInvite(conversation.id);
      setInviteLink(invite.link);
      toast("Đã tạo link mời", "success");
    } catch {
      toast("Tạo link thất bại", "error");
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    setAdding(userId);
    try {
      const updated = await addGroupMember(conversation.id, userId);
      upsertConversation(updated);
      toast("Đã thêm thành viên", "success");
      setShowAddMember(false);
    } catch {
      toast("Thêm thành viên thất bại", "error");
    } finally {
      setAdding(null);
    }
  };

  const handleLeave = async () => {
    if (!user || !confirm("Rời nhóm này?")) return;
    try {
      await leaveGroup(conversation.id, user.id);
      useChatStore.setState((state) => ({
        conversations: state.conversations.filter((c) => c.id !== conversation.id),
      }));
      toast("Đã rời nhóm", "success");
      onClose();
    } catch {
      toast("Không thể rời nhóm", "error");
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
        className="relative max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface"
        style={{ paddingBottom: "max(16px, var(--safe-area-bottom))" }}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-4 py-4">
          <h2 className="text-lg font-semibold">Thông tin nhóm</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
              {conversation.displayName.charAt(0).toUpperCase()}
            </div>
            <p className="text-lg font-semibold">{conversation.displayName}</p>
            <p className="text-sm text-text-secondary">
              {conversation.memberCount ?? conversation.members.length} thành viên
            </p>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">Thành viên</h3>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddMember((v) => !v)}
                  className="text-sm text-primary"
                >
                  {showAddMember ? "Đóng" : "+ Thêm"}
                </button>
              )}
            </div>

            <div className="divide-y divide-border rounded-xl border border-border">
              {conversation.members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 px-3 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                    {member.user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {member.user.displayName}
                      {member.userId === user?.id && " (bạn)"}
                    </p>
                    <p className="text-xs text-text-secondary">{member.user.email}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      member.role === "admin"
                        ? "bg-primary/15 text-primary"
                        : "bg-surface text-text-secondary",
                    )}
                  >
                    {member.role === "admin" ? "Admin" : "Thành viên"}
                  </span>
                </div>
              ))}
            </div>

            {showAddMember && (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-border">
                {addableUsers.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-text-secondary">
                    Không còn người để thêm
                  </p>
                ) : (
                  addableUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      disabled={adding === u.id}
                      onClick={() => handleAddMember(u.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/5 disabled:opacity-50"
                    >
                      <span className="font-medium">{u.displayName}</span>
                      <span className="text-sm text-text-secondary">{u.email}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="mb-4 rounded-xl border border-border p-4">
              <h3 className="mb-2 font-medium">Mời thành viên</h3>
              <p className="mb-3 text-sm text-text-secondary">
                Link hết hạn sau 24h, tối đa 10 lượt dùng
              </p>
              {!inviteLink ? (
                <button
                  type="button"
                  disabled={loadingInvite}
                  onClick={handleCreateInvite}
                  className="w-full rounded-xl bg-primary py-3 font-medium text-on-primary disabled:opacity-50"
                >
                  {loadingInvite ? "Đang tạo..." : "Tạo link & QR"}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <QRCodeSVG value={inviteLink} size={160} />
                  <p className="break-all text-center text-xs text-text-secondary">
                    {inviteLink}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(inviteLink);
                      toast("Đã copy link", "success");
                    }}
                    className="rounded-xl border border-border px-4 py-2 text-sm"
                  >
                    Copy link
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleLeave}
            className="w-full rounded-xl border border-red-500/30 py-3 text-red-400"
          >
            Rời nhóm
          </button>
        </div>
      </div>
    </div>
  );
}
