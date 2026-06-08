import type { ThemeTokens } from "./types.js";

export const warmHome: ThemeTokens = {
  id: "warm-home",
  name: "Ấm Cúng",
  colors: {
    background: "#FFF8F0",
    foreground: "#5C4033",
    surface: "#FFF0E6",
    primary: "#E8A598",
    onPrimary: "#FFFFFF",
    bubbleSent: "#E8A598",
    bubbleReceived: "#FFFFFF",
    textPrimary: "#5C4033",
    textSecondary: "#8B7355",
    accent: "#D4574B",
    border: "#E8D5C4",
  },
};

export const midnight: ThemeTokens = {
  id: "midnight",
  name: "Đêm Khuya",
  colors: {
    background: "#0D1117",
    foreground: "#C9D1D9",
    surface: "#161B22",
    primary: "#58A6FF",
    onPrimary: "#FFFFFF",
    bubbleSent: "#238636",
    bubbleReceived: "#21262D",
    textPrimary: "#C9D1D9",
    textSecondary: "#8B949E",
    accent: "#F78166",
    border: "#30363D",
  },
};

export const forest: ThemeTokens = {
  id: "forest",
  name: "Rừng Xanh",
  colors: {
    background: "#1B4332",
    foreground: "#F1FAEE",
    surface: "#2D6A4F",
    primary: "#95D5B2",
    onPrimary: "#1B4332",
    bubbleSent: "#40916C",
    bubbleReceived: "#2D6A4F",
    textPrimary: "#F1FAEE",
    textSecondary: "#B7E4C7",
    accent: "#FF6B6B",
    border: "#40916C",
  },
};

export const ocean: ThemeTokens = {
  id: "ocean",
  name: "Đại Dương",
  colors: {
    background: "#CAF0F8",
    foreground: "#023E8A",
    surface: "#FFFFFF",
    primary: "#0077B6",
    onPrimary: "#FFFFFF",
    bubbleSent: "#0077B6",
    bubbleReceived: "#E8F4FD",
    textPrimary: "#023E8A",
    textSecondary: "#4895EF",
    accent: "#FF6B6B",
    border: "#90E0EF",
  },
};

export const paper: ThemeTokens = {
  id: "paper",
  name: "Giấy Note",
  colors: {
    background: "#FAFAF8",
    foreground: "#1A1A1A",
    surface: "#FFFFFF",
    primary: "#1A1A1A",
    onPrimary: "#FFFFFF",
    bubbleSent: "#1A1A1A",
    bubbleReceived: "#F0F0EE",
    textPrimary: "#1A1A1A",
    textSecondary: "#888888",
    accent: "#D4574B",
    border: "#E0E0DE",
  },
};

export const presets = [warmHome, midnight, forest, ocean, paper] as const;

export const presetMap: Record<string, ThemeTokens> = {
  "warm-home": warmHome,
  midnight,
  forest,
  ocean,
  paper,
};

export function getPresetTheme(id: string): ThemeTokens | undefined {
  return presetMap[id];
}

export function resolveThemeId(
  themeId: string | undefined,
  prefersDark: boolean,
): ThemeTokens {
  if (!themeId || themeId === "system") {
    return prefersDark ? midnight : warmHome;
  }
  return getPresetTheme(themeId) ?? midnight;
}
