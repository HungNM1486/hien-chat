"use client";

import { getThemeIdentity, type PresetThemeId } from "@hien-nha/theme";
import { cn } from "@/lib/utils";

interface ThemeTaglineProps {
  themeId: PresetThemeId | string;
  className?: string;
}

export function ThemeTagline({ themeId, className }: ThemeTaglineProps) {
  const identity = getThemeIdentity(themeId);
  if (!identity) return null;

  return (
    <p className={cn("text-[13px] text-text-secondary", className)}>
      {identity.tagline}
    </p>
  );
}
