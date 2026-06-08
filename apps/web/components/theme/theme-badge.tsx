"use client";

import { getThemeIdentity, type PresetThemeId } from "@hien-nha/theme";
import { cn } from "@/lib/utils";

interface ThemeBadgeProps {
  themeId: PresetThemeId | string;
  className?: string;
  size?: "sm" | "md";
}

export function ThemeBadge({ themeId, className, size = "sm" }: ThemeBadgeProps) {
  const identity = getThemeIdentity(themeId);
  if (!identity) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 font-medium text-primary",
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
        className,
      )}
    >
      <span aria-hidden>{identity.emoji}</span>
      <span>{identity.accentLabel}</span>
    </span>
  );
}
