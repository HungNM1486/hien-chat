"use client";

import { useTheme } from "@/components/theme/theme-provider";
import { ThemeMascot } from "@/components/theme/theme-mascot";
import { ThemeTagline } from "@/components/theme/theme-tagline";
import { Logo } from "@/components/brand/logo";
import type { PresetThemeId } from "@hien-nha/theme";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { activeTheme } = useTheme();

  return (
    <div className="theme-pattern-surface relative flex min-h-full flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="theme-ambience-glow pointer-events-none absolute inset-0" />
      <div className="relative mb-6 hidden flex-col items-center gap-4 sm:flex">
        <div className="theme-mascot-frame flex h-28 w-28 items-center justify-center overflow-hidden">
          <ThemeMascot themeId={activeTheme.id as PresetThemeId} size={96} />
        </div>
        <div className="text-center">
          <Logo showTagline={false} markSize={44} className="justify-center" />
          <ThemeTagline
            themeId={activeTheme.id}
            className="mt-2 text-center text-sm"
          />
        </div>
      </div>
      <div className="relative w-full max-w-[400px]">{children}</div>
    </div>
  );
}
