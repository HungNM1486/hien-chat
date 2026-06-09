"use client";

import { useState } from "react";
import {
  BellSimpleIcon,
  BellSlashIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
import { SettingsScroll } from "@/components/layout/settings-scroll";
import { useNotificationStore } from "@/stores/notification-store";
import {
  ensurePushSubscription,
  removePushSubscription,
} from "@/lib/push-api";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

export default function NotificationsSettingsPage() {
  const prefs = useNotificationStore();
  const [busy, setBusy] = useState(false);

  const pushSupported =
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  const handlePushToggle = async (enabled: boolean) => {
    prefs.setPref("pushEnabled", enabled);
    if (!enabled) {
      setBusy(true);
      try {
        await removePushSubscription();
        prefs.setPushSubscribed(false);
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      const ok = await ensurePushSubscription();
      prefs.setPushSubscribed(ok);
      prefs.setPushPermission(
        "Notification" in window ? Notification.permission : "unsupported",
      );
      if (!ok) {
        toast("Không thể bật push — kiểm tra quyền thông báo", "error");
        prefs.setPref("pushEnabled", false);
      }
    } catch {
      toast("Không thể bật push", "error");
      prefs.setPref("pushEnabled", false);
    } finally {
      setBusy(false);
    }
  };

  const requestPushPermission = async () => {
    setBusy(true);
    try {
      const ok = await ensurePushSubscription();
      prefs.setPushSubscribed(ok);
      prefs.setPushPermission(Notification.permission);
      prefs.setPref("pushEnabled", ok);
      if (ok) toast("Đã bật thông báo push", "success");
      else toast("Cần cho phép thông báo trong trình duyệt", "error");
    } catch {
      toast("Không thể đăng ký push", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      header={
        <AppHeader
          title="Thông báo"
          subtitle="Tin nhắn, cuộc gọi và push"
          backHref="/settings"
        />
      }
    >
      <SettingsScroll narrow className="py-6">
        <div className="flex flex-col gap-3 px-4 lg:px-0">
        <section className="settings-card overflow-hidden">
          <div className="border-b border-border/40 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Trong ứng dụng
            </p>
          </div>
          <ToggleRow
            label="Toast tin nhắn mới"
            desc="Hiện banner khi có tin ở cuộc chat khác"
            checked={prefs.inAppToast}
            onChange={(v) => prefs.setPref("inAppToast", v)}
          />
          <ToggleRow
            label="Âm thanh tin nhắn"
            desc="Phát tiếng khi nhận tin mới"
            checked={prefs.messageSound}
            onChange={(v) => prefs.setPref("messageSound", v)}
          />
          <ToggleRow
            label="Chuông cuộc gọi"
            desc="Phát chuông khi có cuộc gọi đến"
            checked={prefs.callRing}
            onChange={(v) => prefs.setPref("callRing", v)}
          />
          <ToggleRow
            label="Thông báo khi ẩn tab"
            desc="Dùng thông báo hệ thống khi tab không hiển thị"
            checked={prefs.desktopNotify}
            onChange={(v) => prefs.setPref("desktopNotify", v)}
          />
        </section>

        <section className="settings-card overflow-hidden">
          <div className="border-b border-border/40 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Push (khi đóng app)
            </p>
          </div>

          {!pushSupported ? (
            <div className="flex items-start gap-3 px-4 py-4">
              <WarningCircleIcon
                size={22}
                className="mt-0.5 shrink-0 text-text-secondary"
                aria-hidden
              />
              <p className="text-sm leading-relaxed text-text-secondary">
                Trình duyệt không hỗ trợ push notification.
              </p>
            </div>
          ) : (
            <>
              <StatusRow
                icon={
                  prefs.pushSubscribed ? (
                    <CheckCircleIcon
                      size={20}
                      weight="fill"
                      className="text-primary"
                      aria-hidden
                    />
                  ) : (
                    <BellSlashIcon
                      size={20}
                      className="text-text-secondary"
                      aria-hidden
                    />
                  )
                }
                label="Trạng thái push"
                value={
                  prefs.pushSubscribed
                    ? "Đã đăng ký"
                    : prefs.pushPermission === "denied"
                      ? "Bị chặn"
                      : "Chưa bật"
                }
              />
              <ToggleRow
                label="Push notification"
                desc="Nhận tin và cuộc gọi khi không mở app"
                checked={prefs.pushEnabled}
                disabled={busy}
                onChange={(v) => void handlePushToggle(v)}
              />
              {prefs.pushPermission === "denied" && (
                <div className="border-t border-border/40 px-4 py-3">
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Quyền thông báo bị chặn. Vào cài đặt trình duyệt để cho phép
                    lại.
                  </p>
                </div>
              )}
              {prefs.pushPermission === "default" && !prefs.pushSubscribed && (
                <div className="border-t border-border/40 p-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void requestPushPermission()}
                    className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary"
                  >
                    <BellSimpleIcon size={18} weight="fill" aria-hidden />
                    Cho phép thông báo
                  </button>
                </div>
              )}
            </>
          )}
        </section>
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
    <label
      className={cn(
        "flex min-h-[var(--touch-target)] cursor-pointer items-center justify-between border-t border-border/40 px-4 py-3.5 first:border-t-0",
        disabled && "pointer-events-none opacity-60",
      )}
    >
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

function StatusRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border/40 px-4 py-3.5 first:border-t-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}
