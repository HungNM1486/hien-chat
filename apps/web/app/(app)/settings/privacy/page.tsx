"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
import { SettingsScroll } from "@/components/layout/settings-scroll";
import { updateProfile } from "@/lib/user-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

export default function PrivacySettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [saving, setSaving] = useState(false);

  const hideLastSeen = user?.settings?.hideLastSeen ?? false;
  const hideReadReceipts = user?.settings?.hideReadReceipts ?? false;

  const updateSetting = async (
    key: "hideLastSeen" | "hideReadReceipts",
    value: boolean,
  ) => {
    setSaving(true);
    try {
      const updated = await updateProfile({ settings: { [key]: value } });
      setUser(updated);
    } catch {
      toast("Cập nhật thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      header={<AppHeader title="Quyền riêng tư" subtitle="Kiểm soát thông tin hiển thị" backHref="/settings" />}
    >
      <SettingsScroll narrow className="py-6">
        <div className="flex flex-col gap-3 px-4 lg:px-0">
        <ToggleRow
          label="Ẩn trạng thái hoạt động"
          desc="Người khác không thấy bạn online"
          checked={hideLastSeen}
          disabled={saving}
          onChange={(v) => updateSetting("hideLastSeen", v)}
        />
        <ToggleRow
          label="Tắt xác nhận đã đọc"
          desc="Người khác không thấy dấu đã đọc khi bạn xem tin"
          checked={hideReadReceipts}
          disabled={saving}
          onChange={(v) => updateSetting("hideReadReceipts", v)}
        />
        </div>
      </SettingsScroll>
    </AppShell>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="settings-card flex min-h-[var(--touch-target)] cursor-pointer items-center justify-between px-4 py-3.5">
      <div className="pr-4">
        <p className="font-medium text-text-primary">{label}</p>
        <p className="text-sm leading-relaxed text-text-secondary">{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-primary"
      />
    </label>
  );
}
