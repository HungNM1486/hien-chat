"use client";

import { getThemeIdentity, type PresetThemeId, type ThemeTokens } from "@hien-nha/theme";
import { ThemeMascot } from "@/components/theme/theme-mascot";
import { cn } from "@/lib/utils";

interface ThemeHeroCardProps {
  theme: ThemeTokens;
  className?: string;
}

export function ThemeHeroCard({ theme, className }: ThemeHeroCardProps) {
  const identity = getThemeIdentity(theme.id);
  if (!identity) return null;

  return (
    <div
      className={cn(
        "theme-pattern-surface relative overflow-hidden rounded-[var(--radius-card,18px)] border-2 border-primary/20 p-5",
        className,
      )}
      style={{
        background: `linear-gradient(145deg, color-mix(in srgb, ${theme.colors.primary} 12%, ${theme.colors.surface}), ${theme.colors.surface})`,
      }}
    >
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border-2 border-primary/20 bg-surface shadow-sm">
          <ThemeMascot themeId={theme.id as PresetThemeId} size={72} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {identity.emoji}
            </span>
            <h3 className="text-lg font-bold text-text-primary">{theme.name}</h3>
          </div>
          <p className="mt-1 text-sm font-medium text-primary">{identity.mood}</p>
          <p className="mt-1.5 text-sm text-text-secondary">{identity.tagline}</p>
        </div>
      </div>
      <div className="relative z-10 mt-4 flex gap-2">
        <div
          className="bubble-sent flex-1 rounded-[var(--radius-bubble)] px-3 py-2 text-xs font-medium"
          style={{ background: theme.colors.bubbleSent, color: theme.colors.onPrimary }}
        >
          Tin gửi
        </div>
        <div
          className="flex-1 rounded-[var(--radius-bubble)] border px-3 py-2 text-xs font-medium"
          style={{
            background: theme.colors.bubbleReceived,
            borderColor: theme.colors.border,
            color: theme.colors.textPrimary,
          }}
        >
          Tin nhận
        </div>
      </div>
    </div>
  );
}
