"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  applyThemeToElement,
  resolveThemeId,
  type FontSizeOption,
  type ThemeId,
  type ThemeTokens,
} from "@hien-nha/theme";
import { updateProfile } from "@/lib/user-api";
import { useAuthStore } from "@/stores/auth-store";

interface ThemeContextValue {
  themeId: ThemeId;
  fontSize: FontSizeOption;
  reduceMotion: boolean;
  activeTheme: ThemeTokens;
  setThemeId: (id: ThemeId) => Promise<void>;
  setFontSize: (size: FontSizeOption) => Promise<void>;
  setReduceMotion: (value: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const setUser = useAuthStore((s) => s.setUser);
  const initialApplied = useRef(false);
  const [prefersDark, setPrefersDark] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  const themeId = (user?.settings?.theme as ThemeId | undefined) ?? "warm-home";
  const fontSize = user?.settings?.fontSize ?? "normal";
  const reduceMotion = user?.settings?.reduceMotion ?? false;

  const applyAll = useCallback(
    (opts?: { withTransition?: boolean }) => {
      const theme = resolveThemeId(themeId, prefersDark);
      applyThemeToElement(document.documentElement, theme, {
        fontSize,
        withTransition: opts?.withTransition ?? true,
      });

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", theme.colors.background);

      document.documentElement.classList.toggle("reduce-motion", reduceMotion);
    },
    [themeId, fontSize, reduceMotion, prefersDark],
  );

  useEffect(() => {
    if (!isInitialized) return;
    applyAll({ withTransition: initialApplied.current });
    initialApplied.current = true;
  }, [isInitialized, applyAll]);

  useEffect(() => {
    if (themeId !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themeId]);

  const patchSettings = async (
    settings: Record<string, unknown>,
  ): Promise<void> => {
    if (!user) return;
    const updated = await updateProfile({ settings });
    setUser(updated);
  };

  const setThemeId = async (id: ThemeId) => {
    await patchSettings({ theme: id });
  };

  const setFontSize = async (size: FontSizeOption) => {
    await patchSettings({ fontSize: size });
  };

  const setReduceMotion = async (value: boolean) => {
    await patchSettings({ reduceMotion: value });
  };

  const activeTheme = resolveThemeId(themeId, prefersDark);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        fontSize,
        reduceMotion,
        activeTheme,
        setThemeId,
        setFontSize,
        setReduceMotion,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
