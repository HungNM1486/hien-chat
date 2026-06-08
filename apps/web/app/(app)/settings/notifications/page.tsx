"use client";

import { BellSimpleIcon } from "@phosphor-icons/react";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";

export default function NotificationsSettingsPage() {
  return (
    <AppShell header={<AppHeader title="Thông báo" backHref="/settings" />}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary/10">
          <BellSimpleIcon size={40} weight="duotone" className="text-primary" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-text-primary">Sắp ra mắt</h2>
          <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-text-secondary">
            Push notification sẽ có trong Phase 5 (PWA)
          </p>
        </div>
      </div>
    </AppShell>
  );
}
