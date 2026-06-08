"use client";

import { useState } from "react";
import type { ConversationPublic } from "@hien-nha/shared";
import type { ThemeId } from "@hien-nha/theme";
import { ThemePickerGrid } from "@/components/theme/theme-picker-grid";
import { E2ESetupDialog } from "@/components/chat/e2e-setup-dialog";
import { updateConversationSettings } from "@/lib/chat-api";
import { useChatStore } from "@/stores/chat-store";
import { toast } from "@/stores/toast-store";

interface ChatSettingsSheetProps {
  open: boolean;
  conversation: ConversationPublic | undefined;
  onClose: () => void;
}

export function ChatSettingsSheet({
  open,
  conversation,
  onClose,
}: ChatSettingsSheetProps) {
  const [saving, setSaving] = useState(false);
  const upsertConversation = useChatStore((s) => s.upsertConversation);

  if (!open || !conversation) return null;

  const themeOverride =
    (conversation.settings?.themeOverride as ThemeId | null) ?? null;

  const handleTheme = async (id: ThemeId) => {
    if (id === "system") return;
    setSaving(true);
    try {
      const newOverride = themeOverride === id ? null : id;
      const updated = await updateConversationSettings(conversation.id, {
        themeOverride: newOverride,
      });
      upsertConversation(updated);
      toast(
        newOverride ? "Đã áp dụng theme cho cuộc chat" : "Đã xóa theme riêng",
        "success",
      );
    } catch {
      toast("Cập nhật thất bại", "error");
    } finally {
      setSaving(false);
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
          <h2 className="text-lg font-semibold">Cài đặt cuộc trò chuyện</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4">
          <p className="mb-1 font-medium text-text-primary">
            {conversation.displayName}
          </p>
          <p className="mb-4 text-sm text-text-secondary">
            Theme riêng cho cuộc chat này (tap lại để xóa)
          </p>
          <ThemePickerGrid
            value={themeOverride}
            onChange={handleTheme}
            includeSystem={false}
            disabled={saving}
          />
          {themeOverride && (
            <button
              type="button"
              disabled={saving}
              onClick={() => handleTheme(themeOverride)}
              className="mt-4 w-full rounded-xl border border-border py-3 text-sm text-text-secondary"
            >
              Xóa theme riêng · dùng theme app
            </button>
          )}

          <E2ESetupDialog conversation={conversation} />
        </div>
      </div>
    </div>
  );
}
