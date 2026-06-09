"use client";

import { CheckIcon } from "@phosphor-icons/react";
import {
  getThemeIdentity,
  presets,
  type ThemeId,
} from "@hien-nha/theme";
import { ThemeMascot } from "@/components/theme/theme-mascot";
import { cn } from "@/lib/utils";

interface ThemePickerGridProps {
  value: ThemeId | null;
  onChange: (id: ThemeId) => void;
  includeSystem?: boolean;
  disabled?: boolean;
}

export function ThemePickerGrid({
  value,
  onChange,
  includeSystem = true,
  disabled,
}: ThemePickerGridProps) {
  const items = includeSystem
    ? [
        { id: "system" as ThemeId, name: "Hệ thống", colors: null, presetId: null },
        ...presets.map((p) => ({
          id: p.id as ThemeId,
          name: p.name,
          colors: p.colors,
          presetId: p.id,
        })),
      ]
    : presets.map((p) => ({
        id: p.id as ThemeId,
        name: p.name,
        colors: p.colors,
        presetId: p.id,
      }));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const selected = value === item.id;
        const identity = item.presetId ? getThemeIdentity(item.presetId) : null;

        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "pressable theme-pattern-surface relative overflow-hidden rounded-[var(--radius-card,18px)] border-2 p-3.5 text-left transition-all",
              item.presetId && `theme-preview-${item.presetId}`,
              selected
                ? "border-primary shadow-[0_6px_20px_rgb(var(--shadow-color)/0.18)]"
                : "border-border/70 hover:border-primary/35",
              disabled && "opacity-50",
            )}
            style={
              item.colors
                ? {
                    background: `linear-gradient(145deg, color-mix(in srgb, ${item.colors.primary} 10%, ${item.colors.surface}), ${item.colors.surface})`,
                  }
                : undefined
            }
          >
            {item.colors && identity ? (
              <>
                <div className="relative z-10 mb-3 flex items-start gap-3">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border shadow-sm"
                    style={{
                      borderColor: item.colors.border,
                      background: item.colors.surface,
                    }}
                  >
                    <ThemeMascot themeId={item.presetId!} size={48} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg" aria-hidden>
                        {identity.emoji}
                      </span>
                      <span className="font-semibold text-text-primary">{item.name}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-text-secondary">
                      {identity.mood}
                    </p>
                  </div>
                </div>
                <div className="relative z-10 flex gap-1.5">
                  <div
                    className="h-8 flex-1 rounded-xl"
                    style={{ background: item.colors.background }}
                  />
                  <div
                    className="h-8 flex-1 rounded-xl"
                    style={{ background: item.colors.primary }}
                  />
                  <div
                    className="h-8 flex-1 rounded-xl border"
                    style={{
                      background: item.colors.bubbleReceived,
                      borderColor: item.colors.border,
                    }}
                  />
                </div>
                <div className="relative z-10 mt-2 flex gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: item.colors.bubbleSent,
                      color: item.colors.onPrimary,
                    }}
                  >
                    Gửi
                  </span>
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: item.colors.bubbleReceived,
                      borderColor: item.colors.border,
                      color: item.colors.textPrimary,
                    }}
                  >
                    Nhận
                  </span>
                </div>
              </>
            ) : (
              <div className="relative z-10">
                <div className="mb-3 flex h-14 overflow-hidden rounded-2xl shadow-inner">
                  <div className="flex-1 bg-[#FFE8F0]" />
                  <div className="flex-1 bg-[#121615]" />
                </div>
                <span className="font-semibold text-text-primary">{item.name}</span>
                <p className="mt-1 text-[12px] text-text-secondary">
                  Tự động theo sáng/tối hệ thống
                </p>
              </div>
            )}
            {selected && (
              <span className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                <CheckIcon size={14} weight="bold" aria-hidden />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
