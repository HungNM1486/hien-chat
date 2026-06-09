"use client";

import { CheckCircleIcon, InfoIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const iconMap = {
  success: CheckCircleIcon,
  error: WarningCircleIcon,
  info: InfoIcon,
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed inset-x-4 z-[450] flex flex-col gap-2 pointer-events-none"
      style={{ bottom: "calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 16px)" }}
    >
      {toasts.map((t) => {
        const Icon = iconMap[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-2xl border bg-surface px-4 py-3 opacity-100 shadow-[0_8px_32px_rgb(var(--shadow-color)/0.3)] animate-fade-up",
              t.type === "error" && "border-accent/30",
              t.type === "success" && "border-primary/30",
              t.type === "info" && "border-border/60",
            )}
            role="alert"
          >
            <Icon
              size={20}
              weight="fill"
              className={cn(
                "shrink-0",
                t.type === "error" && "text-accent",
                t.type === "success" && "text-primary",
                t.type === "info" && "text-text-secondary",
              )}
              aria-hidden
            />
            <p className="flex-1 text-sm text-text-primary">{t.message}</p>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="shrink-0 text-sm font-semibold text-primary"
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-full p-1 text-text-secondary transition-colors hover:bg-foreground/5"
              aria-label="Đóng"
            >
              <XIcon size={16} aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
