"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
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
    <AppShell header={<AppHeader title="Quyền riêng tư" backHref="/settings" />}>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-6">
        <ToggleRow
          label="Ẩn trạng thái hoạt động"
          desc="Người khác không thấy bạn online"
          checked={hideLastSeen}
          disabled={saving}
          onChange={(v) => updateSetting("hideLastSeen", v)}
        />
        <ToggleRow
          label="Tắt xác nhận đã đọc"
          desc="Người khác không thấy ✓✓ khi bạn đọc tin"
          checked={hideReadReceipts}
          disabled={saving}
          onChange={(v) => updateSetting("hideReadReceipts", v)}
        />
      </div>
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
    <label className="flex min-h-[var(--touch-target)] items-center justify-between rounded-xl border border-border px-4 py-3">
      <div className="pr-4">
        <p className="font-medium text-text-primary">{label}</p>
        <p className="text-sm text-text-secondary">{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 shrink-0 accent-primary"
      />
    </label>
  );
}
