"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ConversationPublic } from "@hien-nha/shared";
import {
  CopyIcon,
  LinkIcon,
  PlusIcon,
  SignOutIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import {
  addGroupMember,
  createInvite,
  fetchUsers,
  leaveGroup,
} from "@/lib/chat-api";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { toast } from "@/stores/toast-store";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { UserAvatar } from "@/components/ui/user-avatar";
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
    if (!showAddMember) return;
    fetchUsers().then(setUsers);
  }, [showAddMember]);

  if (!conversation || conversation.type !== "group") return null;

  const memberIds = new Set(conversation.members.map((m) => m.userId));
  const addableUsers = users.filter((u) => !memberIds.has(u.id));

  const handleClose = () => {
    setShowAddMember(false);
    setInviteLink(null);
    onClose();
  };

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
      handleClose();
    } catch {
      toast("Không thể rời nhóm", "error");
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title="Thông tin nhóm"
      subtitle={`${conversation.memberCount ?? conversation.members.length} thành viên`}
    >
      <div className="space-y-6 px-5 pb-6">
        <div className="flex flex-col items-center py-2 text-center">
          <UserAvatar
            name={conversation.displayName}
            avatarUrl={conversation.displayAvatar}
            size="lg"
            ring
            className="mb-3"
          />
          <p className="text-xl font-semibold tracking-tight">{conversation.displayName}</p>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-text-primary">Thành viên</h3>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAddMember((v) => !v)}
                className="pressable inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
              >
                {showAddMember ? "Đóng" : (
                  <>
                    <PlusIcon size={14} weight="bold" aria-hidden />
                    Thêm
                  </>
                )}
              </button>
            )}
          </div>

          <div className="settings-card divide-y divide-border/60 overflow-hidden">
            {conversation.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 px-3 py-3"
              >
                <UserAvatar
                  name={member.user.displayName}
                  avatarUrl={member.user.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">
                    {member.user.displayName}
                    {member.userId === user?.id && (
                      <span className="ml-1 text-text-secondary">(bạn)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-text-secondary">{member.user.email}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    member.role === "admin"
                      ? "bg-primary/15 text-primary"
                      : "bg-background/50 text-text-secondary",
                  )}
                >
                  {member.role === "admin" ? "Admin" : "Thành viên"}
                </span>
              </div>
            ))}
          </div>

          {showAddMember && (
            <div className="settings-card mt-3 max-h-44 overflow-y-auto">
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
                    className="pressable flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left last:border-b-0 hover:bg-foreground/[0.03] disabled:opacity-50"
                  >
                    <UserPlusIcon size={18} className="text-primary" aria-hidden />
                    <div className="min-w-0">
                      <span className="block font-medium text-text-primary">{u.displayName}</span>
                      <span className="block truncate text-sm text-text-secondary">{u.email}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </section>

        {isAdmin && (
          <section className="settings-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <LinkIcon size={18} className="text-primary" aria-hidden />
              <h3 className="font-medium text-text-primary">Mời thành viên</h3>
            </div>
            <p className="mb-4 text-sm text-text-secondary">
              Link hết hạn sau 24 giờ, tối đa 10 lượt dùng
            </p>
            {!inviteLink ? (
              <button
                type="button"
                disabled={loadingInvite}
                onClick={handleCreateInvite}
                className="btn-primary w-full"
              >
                {loadingInvite ? "Đang tạo..." : "Tạo link & QR"}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <QRCodeSVG value={inviteLink} size={160} />
                </div>
                <p className="break-all text-center font-mono text-[11px] text-text-secondary">
                  {inviteLink}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(inviteLink);
                    toast("Đã copy link", "success");
                  }}
                  className="btn-secondary inline-flex gap-2 text-sm"
                >
                  <CopyIcon size={16} aria-hidden />
                  Copy link
                </button>
              </div>
            )}
          </section>
        )}

        <button
          type="button"
          onClick={handleLeave}
          className="btn-danger w-full gap-2"
        >
          <SignOutIcon size={18} aria-hidden />
          Rời nhóm
        </button>
      </div>
    </BottomSheet>
  );
}
