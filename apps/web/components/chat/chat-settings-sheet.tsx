"use client";

import { useState } from "react";
import type { ConversationPublic } from "@hien-nha/shared";
import type { ThemeId } from "@hien-nha/theme";
import { PaletteIcon } from "@phosphor-icons/react";
import { ThemePickerGrid } from "@/components/theme/theme-picker-grid";
import { E2ESetupDialog } from "@/components/chat/e2e-setup-dialog";
import { BottomSheet } from "@/components/ui/bottom-sheet";
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

  if (!conversation) return null;

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
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Cài đặt cuộc trò chuyện"
      subtitle={conversation.displayName}
    >
      <div className="space-y-6 px-5 pb-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <PaletteIcon size={18} className="text-primary" aria-hidden />
            <h3 className="font-medium text-text-primary">Theme riêng</h3>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-text-secondary">
            Chọn màu riêng cho cuộc chat này. Chạm lại theme đang chọn để xóa.
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
              className="btn-secondary mt-4 w-full text-sm"
            >
              Xóa theme riêng · dùng theme app
            </button>
          )}
        </section>

        <E2ESetupDialog conversation={conversation} />
      </div>
    </BottomSheet>
  );
}
