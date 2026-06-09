"use client";

import { useRouter } from "next/navigation";
import {
  ChatCircleDotsIcon,
  PhoneIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useNotificationBannerStore } from "@/stores/notification-banner-store";
import { cn } from "@/lib/utils";

export function IncomingBanner() {
  const router = useRouter();
  const banner = useNotificationBannerStore((s) => s.banner);
  const dismiss = useNotificationBannerStore((s) => s.dismiss);

  if (!banner) return null;

  const Icon = banner.kind === "call" ? PhoneIcon : ChatCircleDotsIcon;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[500] flex justify-center px-3 pt-[max(12px,var(--safe-area-top))] pointer-events-none"
      role="alert"
      aria-live="assertive"
    >
      <button
        type="button"
        onClick={() => {
          dismiss();
          router.push(banner.href);
        }}
        className={cn(
          "pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-[0_12px_40px_rgb(var(--shadow-color)/0.35)]",
          "bg-surface opacity-100",
          banner.kind === "call"
            ? "border-primary/40 ring-2 ring-primary/20"
            : "border-border/70",
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            banner.kind === "call" ? "bg-primary text-on-primary" : "bg-primary/12 text-primary",
          )}
        >
          <Icon size={22} weight="fill" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text-primary">
            {banner.title}
          </span>
          <span className="mt-0.5 block line-clamp-2 text-sm leading-snug text-text-secondary">
            {banner.body}
          </span>
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              dismiss();
            }
          }}
          className="shrink-0 rounded-full p-1.5 text-text-secondary hover:bg-foreground/5"
          aria-label="Đóng"
        >
          <XIcon size={16} aria-hidden />
        </span>
      </button>
    </div>
  );
}
