"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";

export default function NotificationsSettingsPage() {
  return (
    <AppShell header={<AppHeader title="Thông báo" backHref="/settings" />}>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-4xl">🔔</span>
        <h2 className="text-lg font-semibold text-text-primary">Sắp ra mắt</h2>
        <p className="text-sm text-text-secondary">
          Push notification sẽ có trong Phase 5 (PWA)
        </p>
      </div>
    </AppShell>
  );
}
