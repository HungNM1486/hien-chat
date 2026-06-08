"use client";

import { getThemeIdentity } from "@hien-nha/theme";
import { LogoMark } from "@/components/brand/logo-mark";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

interface LogoProps {
  showTagline?: boolean;
  markSize?: number;
  className?: string;
}

export function Logo({ showTagline = false, markSize = 44, className }: LogoProps) {
  const { activeTheme } = useTheme();
  const identity = getThemeIdentity(activeTheme.id);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={markSize} themeId={activeTheme.id} />
      <div className="min-w-0 text-left">
        <p className="text-xl font-bold leading-tight tracking-[-0.02em] text-text-primary">
          Hiên nhà
        </p>
        {showTagline && identity && (
          <p className="text-[13px] text-text-secondary">{identity.tagline}</p>
        )}
      </div>
    </div>
  );
}
