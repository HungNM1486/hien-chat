"use client";

import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed inset-x-4 z-[200] flex flex-col gap-2 pointer-events-none"
      style={{ bottom: "calc(var(--bottom-nav-height) + var(--safe-area-bottom) + 16px)" }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur",
            t.type === "error" && "border-accent/40 bg-surface/95",
            t.type === "success" && "border-primary/40 bg-surface/95",
            t.type === "info" && "border-border bg-surface/95",
          )}
          role="alert"
        >
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
            className="shrink-0 text-text-secondary"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
