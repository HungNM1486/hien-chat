"use client";

import { useTheme } from "@/components/theme/theme-provider";
import { ThemeMascot } from "@/components/theme/theme-mascot";
import { ThemeTagline } from "@/components/theme/theme-tagline";
import { Logo } from "@/components/brand/logo";
import type { PresetThemeId } from "@hien-nha/theme";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const { activeTheme } = useTheme();

  return (
    <div className="theme-pattern-surface relative flex min-h-full flex-col overflow-hidden lg:min-h-[100dvh] lg:flex-row">
      <div className="theme-ambience-glow pointer-events-none absolute inset-0" />

      <div className="relative hidden flex-1 flex-col items-center justify-center px-10 py-12 lg:flex">
        <div className="max-w-md text-center">
          <div className="theme-mascot-frame mx-auto flex h-36 w-36 items-center justify-center overflow-hidden">
            <ThemeMascot themeId={activeTheme.id as PresetThemeId} size={120} />
          </div>
          <div className="mt-8">
            <Logo showTagline={false} markSize={52} className="justify-center" />
            <ThemeTagline
              themeId={activeTheme.id}
              className="mt-3 text-center text-[15px] leading-relaxed"
            />
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 lg:max-w-[480px] lg:shrink-0 lg:border-l lg:border-border/50 lg:bg-surface/60 lg:px-10 lg:backdrop-blur-xl xl:max-w-[520px]">
        <div className="mb-6 flex flex-col items-center gap-4 lg:hidden">
          <div className="theme-mascot-frame flex h-24 w-24 items-center justify-center overflow-hidden">
            <ThemeMascot themeId={activeTheme.id as PresetThemeId} size={80} />
          </div>
          <Logo showTagline={false} markSize={40} className="justify-center" />
        </div>
        <div className="relative w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
