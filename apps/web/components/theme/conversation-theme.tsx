"use client";

import { useEffect, useRef } from "react";
import {
  applyThemeToElement,
  clearScopedTheme,
  fontSizeToCssVariables,
  getPresetTheme,
  type FontSizeOption,
} from "@hien-nha/theme";
import { useTheme } from "@/components/theme/theme-provider";

interface ConversationThemeProps {
  themeOverride?: string | null;
  wallpaperUrl?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function ConversationTheme({
  themeOverride,
  wallpaperUrl,
  children,
  className,
}: ConversationThemeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { fontSize, themeId: globalThemeId } = useTheme();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (themeOverride) {
      const preset = getPresetTheme(themeOverride);
      if (preset) {
        applyThemeToElement(el, preset, { fontSize, withTransition: true });
      }
    } else {
      clearScopedTheme(el);
      const fontVars = fontSizeToCssVariables(fontSize as FontSizeOption);
      for (const [key, value] of Object.entries(fontVars)) {
        el.style.setProperty(key, value);
      }
    }

    return () => clearScopedTheme(el);
  }, [themeOverride, fontSize, globalThemeId]);

  return (
    <div
      ref={ref}
      className={className}
      style={
        wallpaperUrl
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${wallpaperUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
