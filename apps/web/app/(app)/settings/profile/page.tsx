"use client";

import { useRef, useState } from "react";
import { CameraIcon } from "@phosphor-icons/react";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
import { UserAvatar } from "@/components/ui/user-avatar";
import { updateProfile, uploadAvatar } from "@/lib/user-api";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

export default function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateProfile({ displayName: displayName.trim() });
      setUser(updated);
      toast("Đã cập nhật hồ sơ", "success");
    } catch {
      toast("Cập nhật thất bại", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (file: File) => {
    setUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setUser(updated);
      toast("Đã cập nhật ảnh đại diện", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload thất bại", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell header={<AppHeader title="Hồ sơ" subtitle="Thông tin cá nhân" backHref="/settings" />}>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="group relative"
          >
            <UserAvatar
              name={user?.displayName}
              avatarUrl={user?.avatarUrl}
              size="xl"
              ring
            />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-[28px] bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
              <CameraIcon size={22} aria-hidden />
              <span className="text-xs font-medium">{uploading ? "..." : "Đổi ảnh"}</span>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatar(file);
            }}
          />
          <p className="text-sm text-text-secondary">JPEG, PNG, WebP · tối đa 5MB</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Tên hiển thị
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={64}
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Email
          </label>
          <input
            type="email"
            value={user?.email ?? ""}
            disabled
            className="input-field opacity-70"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !displayName.trim()}
          className="btn-primary w-full"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </AppShell>
  );
}
