"use client";

import { useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
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
    <AppShell header={<AppHeader title="Hồ sơ" backHref="/settings" />}>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="relative"
          >
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-3xl font-semibold text-primary">
                {user?.displayName?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-sm text-white opacity-0 transition-opacity active:opacity-100">
              {uploading ? "..." : "Đổi ảnh"}
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
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-text-primary outline-none focus:border-primary"
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
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-text-secondary"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !displayName.trim()}
          className="flex min-h-[var(--touch-target)] items-center justify-center rounded-xl bg-primary font-semibold text-on-primary disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </AppShell>
  );
}
