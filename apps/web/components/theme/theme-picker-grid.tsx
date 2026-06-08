"use client";

import { presets, type ThemeId } from "@hien-nha/theme";
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
    ? [{ id: "system" as ThemeId, name: "Hệ thống", colors: null }, ...presets.map((p) => ({ id: p.id as ThemeId, name: p.name, colors: p.colors }))]
    : presets.map((p) => ({ id: p.id as ThemeId, name: p.name, colors: p.colors }));

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(item.id)}
          className={cn(
            "relative overflow-hidden rounded-2xl border-2 p-3 text-left transition-transform active:scale-[0.98]",
            value === item.id ? "border-primary" : "border-border",
            disabled && "opacity-50",
          )}
        >
          {item.colors ? (
            <div className="mb-2 flex h-12 overflow-hidden rounded-xl">
              <div className="flex-1" style={{ background: item.colors.background }} />
              <div className="flex-1" style={{ background: item.colors.primary }} />
              <div className="flex-1" style={{ background: item.colors.bubbleSent }} />
            </div>
          ) : (
            <div className="mb-2 flex h-12 overflow-hidden rounded-xl">
              <div className="flex-1 bg-[#FFF8F0]" />
              <div className="flex-1 bg-[#0D1117]" />
            </div>
          )}
          <span className="text-sm font-medium text-text-primary">{item.name}</span>
          {value === item.id && (
            <span className="absolute right-2 top-2 text-primary">✓</span>
          )}
        </button>
      ))}
    </div>
  );
}
