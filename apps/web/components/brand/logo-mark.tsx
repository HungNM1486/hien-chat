"use client";

import { ThemeMascot } from "@/components/theme/theme-mascot";
import type { PresetThemeId } from "@hien-nha/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  className?: string;
  themeId?: string;
}

export function LogoMark({ size = 40, className, themeId }: LogoMarkProps) {
  const { activeTheme } = useTheme();
  const id = (themeId ?? activeTheme.id) as PresetThemeId;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[22%] shadow-sm",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <ThemeMascot themeId={id} size={size} className="h-full w-full" />
    </div>
  );
}
