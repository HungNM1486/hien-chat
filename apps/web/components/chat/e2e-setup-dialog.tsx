"use client";

import { useEffect, useState } from "react";
import {
  KeyIcon,
  LockKeyIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import {
  createSharedSecretSession,
  hasSession,
  removeSession,
  unlockSharedSecretSession,
} from "@hien-nha/crypto";
import {
  disableE2E,
  fetchE2ESalt,
  requestE2E,
  verifyE2EKey,
} from "@/lib/e2e-api";
import { clearE2ESession, notifyE2ESessionChanged } from "@/lib/e2e-session";
import { useE2EStore } from "@/stores/e2e-store";
import { useChatStore } from "@/stores/chat-store";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import type { ConversationPublic } from "@hien-nha/shared";
import { cn } from "@/lib/utils";

interface E2ESetupDialogProps {
  conversation: ConversationPublic | undefined;
}

export function E2ESetupDialog({ conversation }: E2ESetupDialogProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const pending = useE2EStore((s) => s.pendingRequest);
  const setPending = useE2EStore((s) => s.setPendingRequest);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const [secret, setSecret] = useState("");
  const [secretConfirm, setSecretConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasLocalKey, setHasLocalKey] = useState(false);

  const isE2E = conversation?.encryptionMode === "e2e";
  const isDirect = conversation?.type === "direct";
  const isInitiator =
    conversation?.settings?.e2eRequesterId === userId ||
    pending?.requesterId === userId;

  useEffect(() => {
    if (!conversation?.id) return;
    void hasSession(conversation.id).then(setHasLocalKey);
  }, [conversation?.id, isE2E]);

  const handleUnlockPending = async () => {
    if (!pending || secret.length < 6) {
      setError("Nhập mã bí mật có ít nhất 6 ký tự.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { verifier } = await unlockSharedSecretSession(
        pending.conversationId,
        secret,
        pending.salt,
      );
      await verifyE2EKey(pending.conversationId, verifier);
      setPending(null);
      setSecret("");
      notifyE2ESessionChanged(pending.conversationId);
      toast("Khóa đúng. Đang giải mã tin nhắn...", "success");
    } catch {
      await removeSession(pending.conversationId);
      setError("Mã bí mật không đúng. Bạn chỉ thấy được chuỗi mã hóa.");
    } finally {
      setBusy(false);
    }
  };

  const handleRequestE2E = async () => {
    if (!conversation) return;
    if (secret.length < 6) {
      setError("Mã bí mật phải có ít nhất 6 ký tự.");
      return;
    }
    if (secret !== secretConfirm) {
      setError("Hai lần nhập mã chưa khớp.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const keyData = await createSharedSecretSession(conversation.id, secret);
      const { conversation: updated } = await requestE2E(
        conversation.id,
        keyData,
      );
      upsertConversation(updated);
      setHasLocalKey(true);
      setSecret("");
      setSecretConfirm("");
      notifyE2ESessionChanged(conversation.id);
      toast(
        "Đã bật mã hóa bắt buộc. Hãy gửi mã cho người nhận qua kênh riêng.",
        "success",
      );
    } catch {
      await removeSession(conversation.id);
      setError("Không thể bật E2EE.");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    if (!conversation || secret.length < 6) {
      setError("Nhập mã bí mật có ít nhất 6 ký tự.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { salt } = await fetchE2ESalt(conversation.id);
      const { verifier } = await unlockSharedSecretSession(
        conversation.id,
        secret,
        salt,
      );
      await verifyE2EKey(conversation.id, verifier);
      setHasLocalKey(true);
      setSecret("");
      notifyE2ESessionChanged(conversation.id);
      toast("Khóa đúng. Đang giải mã tin nhắn...", "success");
    } catch {
      await removeSession(conversation.id);
      notifyE2ESessionChanged(conversation.id);
      setError("Mã bí mật không đúng. Bạn chỉ thấy được chuỗi mã hóa.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisableE2E = async () => {
    if (!conversation) return;
    if (!confirm("Tắt E2EE? Tin mới sẽ không còn được mã hóa.")) return;
    setBusy(true);
    try {
      const { conversation: updated } = await disableE2E(conversation.id);
      await clearE2ESession(conversation.id);
      setHasLocalKey(false);
      upsertConversation(updated);
      toast("Đã tắt E2EE", "success");
    } catch {
      toast("Không thể tắt E2EE", "error");
    } finally {
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
        <div className="e2e-key-panel w-full max-w-[410px] rounded-[28px] border p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="e2e-key-orb">
              <LockKeyIcon size={24} weight="duotone" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Mã hóa bắt buộc
              </p>
              <h2 className="text-lg font-semibold tracking-tight">
                {pending.requesterName} đã bật E2EE
              </h2>
            </div>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Cuộc trò chuyện này đã được mã hóa. Nhập đúng mã bí mật để đọc tin
            nhắn — nếu không, bạn chỉ thấy chuỗi mã hóa. Mã được kiểm tra trên
            thiết bị này, server không nhận mã bí mật.
          </p>

          <label className="mb-2 block text-sm font-medium" htmlFor="e2e-accept-key">
            Mã bí mật
          </label>
          <input
            id="e2e-accept-key"
            type="password"
            autoFocus
            autoComplete="off"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleUnlockPending();
            }}
            className="input-field font-mono tracking-[0.12em]"
            placeholder="Nhập mã đã thống nhất"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPending(null);
                setSecret("");
                setError(null);
              }}
              className="btn-secondary flex-1"
            >
              Để sau
            </button>
            <button
              type="button"
              disabled={busy || secret.length < 6}
              onClick={handleUnlockPending}
              className="btn-primary flex-1"
            >
              {busy ? "Đang xác minh..." : "Mở khóa"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation || !isDirect) return null;

  return (
    <div className="settings-card p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {hasLocalKey ? (
              <ShieldCheckIcon size={21} weight="duotone" />
            ) : (
              <KeyIcon size={21} weight="duotone" />
            )}
          </span>
          <div>
            <p className="font-medium text-text-primary">Khóa bí mật dùng chung</p>
            <p className="text-xs leading-relaxed text-text-secondary">
              Chỉ thiết bị nhập đúng mã mới đọc được tin
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            isE2E && hasLocalKey
              ? "bg-primary/15 text-primary"
              : "bg-background/50 text-text-secondary",
          )}
        >
          {isE2E ? (hasLocalKey ? "Đã mở khóa" : "Đang khóa") : "Chưa bật"}
        </span>
      </div>

      {!isE2E ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="e2e-new-key">
              Tạo mã bí mật
            </label>
            <input
              id="e2e-new-key"
              type="password"
              autoComplete="new-password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              className="input-field font-mono"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-sm font-medium"
              htmlFor="e2e-confirm-key"
            >
              Nhập lại mã
            </label>
            <input
              id="e2e-confirm-key"
              type="password"
              autoComplete="new-password"
              value={secretConfirm}
              onChange={(event) => setSecretConfirm(event.target.value)}
              className="input-field font-mono"
              placeholder="Xác nhận mã bí mật"
            />
          </div>
          <p className="text-xs leading-relaxed text-text-secondary">
            Khi bật, đối phương bắt buộc nhập cùng mã để đọc tin. Trao mã qua
            cuộc gọi hoặc gặp trực tiếp — không gửi trong chính cuộc chat này.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={handleRequestE2E}
            className="btn-primary w-full"
          >
            {busy ? "Đang tạo khóa..." : "Khởi tạo E2EE"}
          </button>
        </div>
      ) : !hasLocalKey ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-text-secondary">
            Cuộc trò chuyện đang được mã hóa. Nhập đúng mã chung để giải mã —
            nếu không, bạn chỉ thấy chuỗi mã hóa.
          </p>
          <input
            type="password"
            autoComplete="off"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            className="input-field font-mono"
            placeholder="Nhập mã bí mật"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={handleUnlock}
            className="btn-primary w-full"
          >
            {busy ? "Đang xác minh..." : "Giải mã cuộc trò chuyện"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.06] p-3 text-sm leading-relaxed text-text-secondary">
            Khóa chỉ được lưu trên thiết bị này. Server chỉ đang giữ ciphertext.
          </div>
          {isInitiator && (
            <button
              type="button"
              disabled={busy}
              onClick={handleDisableE2E}
              className="btn-danger w-full"
            >
              Tắt E2EE
            </button>
          )}
        </div>
      )}
    </div>
  );
}
