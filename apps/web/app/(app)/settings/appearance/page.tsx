"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
import { ThemeHeroCard } from "@/components/theme/theme-hero-card";
import { ThemePickerGrid } from "@/components/theme/theme-picker-grid";
import { useTheme } from "@/components/theme/theme-provider";
import type { FontSizeOption, ThemeId } from "@hien-nha/theme";
import { cn } from "@/lib/utils";

const fontSizes: { id: FontSizeOption; label: string; desc: string }[] = [
  { id: "normal", label: "Bình thường", desc: "16px" },
  { id: "large", label: "Lớn", desc: "+25%" },
  { id: "xlarge", label: "Rất lớn", desc: "+50%" },
];

export default function AppearanceSettingsPage() {
  const {
    themeId,
    fontSize,
    reduceMotion,
    activeTheme,
    setThemeId,
    setFontSize,
    setReduceMotion,
  } = useTheme();
  const [saving, setSaving] = useState(false);

  const handleTheme = async (id: ThemeId) => {
    setSaving(true);
    try {
      await setThemeId(id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      header={<AppHeader title="Giao diện" subtitle="Theme & cỡ chữ" backHref="/settings" />}
    >
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-4 py-6">
        <ThemeHeroCard theme={activeTheme} />

        <section>
          <h2 className="mb-1 font-medium text-text-primary">Theme</h2>
          <p className="mb-4 text-sm text-text-secondary">
            Mỗi theme có mascot, pattern và mood riêng — chọn bộ phù hợp với bạn
          </p>
          <ThemePickerGrid
            value={themeId}
            onChange={handleTheme}
            disabled={saving}
          />
        </section>

        <section>
          <h2 className="mb-1 font-medium text-text-primary">Cỡ chữ</h2>
          <p className="mb-4 text-sm text-text-secondary">Điều chỉnh kích thước chữ toàn app</p>
          <div className="flex flex-col gap-2">
            {fontSizes.map((fs) => (
              <button
                key={fs.id}
                type="button"
                disabled={saving}
                onClick={() => setFontSize(fs.id)}
                className={cn(
                  "pressable flex min-h-[var(--touch-target)] items-center justify-between rounded-2xl border px-4 py-3 transition-colors",
                  fontSize === fs.id
                    ? "border-primary/50 bg-primary/10 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_15%,transparent)]"
                    : "border-border/70 bg-surface-elevated/50 hover:bg-foreground/[0.03]",
                )}
              >
                <span className="font-medium text-text-primary">{fs.label}</span>
                <span className="font-mono text-sm tabular-nums text-text-secondary">{fs.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="settings-card flex min-h-[var(--touch-target)] cursor-pointer items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-text-primary">Giảm chuyển động</p>
              <p className="text-sm text-text-secondary">Tắt animation chuyển theme</p>
            </div>
            <input
              type="checkbox"
              checked={reduceMotion}
              disabled={saving}
              onChange={(e) => setReduceMotion(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-primary"
            />
          </label>
        </section>

        <section>
          <h2 className="mb-1 font-medium text-text-primary">Theme tùy chỉnh</h2>
          <p className="mb-4 text-sm text-text-secondary">Xuất hoặc nhập cấu hình giao diện</p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                const data = JSON.stringify(
                  { themeId, fontSize, reduceMotion, exportedAt: new Date().toISOString() },
                  null,
                  2,
                );
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "hien-nha-theme.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn-secondary w-full text-sm"
            >
              Xuất theme (.json)
            </button>
            <label className="btn-secondary w-full cursor-pointer text-sm">
              Nhập theme
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void file.text().then((text) => {
                    try {
                      const data = JSON.parse(text) as {
                        themeId?: ThemeId;
                        fontSize?: FontSizeOption;
                        reduceMotion?: boolean;
                      };
                      if (data.themeId) void setThemeId(data.themeId);
                      if (data.fontSize) void setFontSize(data.fontSize);
                      if (typeof data.reduceMotion === "boolean") {
                        setReduceMotion(data.reduceMotion);
                      }
                    } catch {
                      // ignore invalid file
                    }
                  });
                }}
              />
            </label>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
