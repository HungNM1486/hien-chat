"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import {
  exportEncryptedBackup,
  fingerprintPublicKey,
  loadIdentity,
} from "@hien-nha/crypto";
import {
  acceptE2E,
  declineE2E,
  disableE2E,
  requestE2E,
} from "@/lib/e2e-api";
import { setupE2ESession } from "@/lib/crypto-init";
import { useE2EStore } from "@/stores/e2e-store";
import { useChatStore } from "@/stores/chat-store";
import { toast } from "@/stores/toast-store";
import type { ConversationPublic } from "@hien-nha/shared";

interface E2ESetupDialogProps {
  conversation: ConversationPublic | undefined;
}

export function E2ESetupDialog({ conversation }: E2ESetupDialogProps) {
  const pending = useE2EStore((s) => s.pendingRequest);
  const setPending = useE2EStore((s) => s.setPendingRequest);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [backupPass, setBackupPass] = useState("");
  const [busy, setBusy] = useState(false);

  const isE2E = conversation?.encryptionMode === "e2e";
  const isDirect = conversation?.type === "direct";
  const otherUserId = conversation?.otherUserId;

  const loadFingerprint = async () => {
    const identity = await loadIdentity();
    if (identity) {
      setFingerprint(fingerprintPublicKey(identity.identityPublicB64));
    }
  };

  const handleAcceptPending = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (otherUserId) {
        await setupE2ESession(pending.conversationId, pending.requesterId);
      }
      const { conversation: updated } = await acceptE2E(pending.conversationId);
      upsertConversation(updated);
      setPending(null);
      toast("Đã bật mã hóa đầu cuối", "success");
    } catch {
      toast("Không thể bật E2E", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDeclinePending = async () => {
    if (!pending) return;
    await declineE2E(pending.conversationId);
    setPending(null);
  };

  const handleRequestE2E = async () => {
    if (!conversation) return;
    if (!confirm("Gửi yêu cầu bật mã hóa đầu cuối?")) return;
    setBusy(true);
    try {
      await requestE2E(conversation.id);
      toast("Đã gửi yêu cầu E2E", "success");
    } catch {
      toast("Gửi yêu cầu thất bại", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDisableE2E = async () => {
    if (!conversation) return;
    if (!confirm("Tắt E2E? Tin mới sẽ không được mã hóa.")) return;
    setBusy(true);
    try {
      const { conversation: updated } = await disableE2E(conversation.id);
      upsertConversation(updated);
      toast("Đã tắt E2E", "success");
    } catch {
      toast("Không thể tắt E2E", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleBackup = async () => {
    if (!backupPass.trim()) return;
    try {
      const blob = await exportEncryptedBackup(backupPass);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Hiên nhà-backup.hien-nha-backup";
      a.click();
      URL.revokeObjectURL(url);
      toast("Đã tải backup", "success");
    } catch {
      toast("Backup thất bại", "error");
    }
  };

  if (pending) {
    return (
      <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4">
        <div className="w-full max-w-[390px] rounded-2xl bg-surface p-6">
          <h2 className="mb-2 text-lg font-semibold">Bật mã hóa đầu cuối?</h2>
          <p className="mb-6 text-sm text-text-secondary">
            {pending.requesterName} muốn bật E2E cho cuộc trò chuyện này. Chỉ
            hai bạn đọc được tin nhắn mới.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={handleDeclinePending}
              className="flex-1 rounded-xl border border-border py-3"
            >
              Từ chối
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleAcceptPending}
              className="flex-1 rounded-xl bg-primary py-3 text-on-primary"
            >
              {busy ? "..." : "Chấp nhận"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation || !isDirect) return null;

  return (
    <div className="mt-6 rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-medium">Bảo mật đầu cuối (E2E) 🔒</p>
          <p className="text-xs text-text-secondary">
            Chỉ bạn và người nhận đọc được tin nhắn
          </p>
        </div>
        <span className="text-sm">{isE2E ? "Bật" : "Tắt"}</span>
      </div>

      {!isE2E ? (
        <button
          type="button"
          disabled={busy}
          onClick={handleRequestE2E}
          className="w-full rounded-xl bg-primary py-3 text-on-primary disabled:opacity-50"
        >
          Yêu cầu bật E2E
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={handleDisableE2E}
          className="w-full rounded-xl border border-red-500/30 py-3 text-red-400"
        >
          Tắt E2E
        </button>
      )}

      {isE2E && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div>
            <p className="mb-1 text-sm font-medium">Xác minh danh tính</p>
            <button
              type="button"
              onClick={() => {
                void loadFingerprint();
                setShowQr((v) => !v);
              }}
              className="text-sm text-primary"
            >
              {showQr ? "Ẩn QR" : "Hiện QR fingerprint"}
            </button>
            {fingerprint && (
              <p className="mt-2 break-all font-mono text-xs text-text-secondary">
                {fingerprint}
              </p>
            )}
            {showQr && fingerprint && (
              <div className="mt-3 flex justify-center">
                <QRCodeSVG value={fingerprint} size={140} />
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Backup khóa</p>
            <input
              type="password"
              placeholder="Passphrase backup..."
              value={backupPass}
              onChange={(e) => setBackupPass(e.target.value)}
              className="mb-2 w-full rounded-xl border border-border bg-background px-4 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleBackup}
              className="w-full rounded-xl border border-border py-2 text-sm"
            >
              Tải backup (.hien-nha-backup)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
