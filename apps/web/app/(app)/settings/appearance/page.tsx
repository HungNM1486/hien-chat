"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
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
  const { themeId, fontSize, reduceMotion, setThemeId, setFontSize, setReduceMotion } =
    useTheme();
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
    <AppShell header={<AppHeader title="Giao diện" backHref="/settings" />}>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Theme
          </h2>
          <ThemePickerGrid
            value={themeId}
            onChange={handleTheme}
            disabled={saving}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Cỡ chữ
          </h2>
          <div className="flex flex-col gap-2">
            {fontSizes.map((fs) => (
              <button
                key={fs.id}
                type="button"
                disabled={saving}
                onClick={() => setFontSize(fs.id)}
                className={cn(
                  "flex min-h-[var(--touch-target)] items-center justify-between rounded-xl border px-4 py-3",
                  fontSize === fs.id
                    ? "border-primary bg-primary/10"
                    : "border-border",
                )}
              >
                <span className="font-medium text-text-primary">{fs.label}</span>
                <span className="text-sm text-text-secondary">{fs.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="flex min-h-[var(--touch-target)] items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="font-medium text-text-primary">Giảm chuyển động</p>
              <p className="text-sm text-text-secondary">Tắt animation chuyển theme</p>
            </div>
            <input
              type="checkbox"
              checked={reduceMotion}
              disabled={saving}
              onChange={(e) => setReduceMotion(e.target.checked)}
              className="h-6 w-6 accent-primary"
            />
          </label>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Theme tùy chỉnh
          </h2>
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
              className="rounded-xl border border-border px-4 py-3 text-left text-sm"
            >
              Xuất theme (.hien-nha-theme.json)
            </button>
            <label className="rounded-xl border border-border px-4 py-3 text-left text-sm">
              Nhập theme
              <input
                type="file"
                accept="application/json,.json"
                className="mt-2 block w-full text-xs"
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
