import type { ThemeTokens } from "./types.js";

export const warmHome: ThemeTokens = {
  id: "warm-home",
  name: "Hello Kitty",
  colors: {
    background: "#FFE8F0",
    foreground: "#4A2540",
    surface: "#FFFBFD",
    primary: "#FF6B9D",
    onPrimary: "#FFFFFF",
    bubbleSent: "#FF6B9D",
    bubbleReceived: "#FFFFFF",
    textPrimary: "#4A2540",
    textSecondary: "#9B6B88",
    accent: "#FF4081",
    border: "#FFD6E8",
  },
};

export const midnight: ThemeTokens = {
  id: "midnight",
  name: "Hiên đêm",
  colors: {
    background: "#121615",
    foreground: "#F2EDE8",
    surface: "#1C2220",
    primary: "#E08B6D",
    onPrimary: "#1A1210",
    bubbleSent: "#B8654A",
    bubbleReceived: "#252B29",
    textPrimary: "#F2EDE8",
    textSecondary: "#9A948E",
    accent: "#E87A68",
    border: "#333A37",
  },
};

export const forest: ThemeTokens = {
  id: "forest",
  name: "Rừng Xanh",
  colors: {
    background: "#152820",
    foreground: "#F1FAEE",
    surface: "#1E3329",
    primary: "#7CB89A",
    onPrimary: "#0F1F18",
    bubbleSent: "#3D7A5C",
    bubbleReceived: "#243D32",
    textPrimary: "#F1FAEE",
    textSecondary: "#A8C9B5",
    accent: "#E06B5A",
    border: "#2F4F40",
  },
};

export const ocean: ThemeTokens = {
  id: "ocean",
  name: "Đại Dương",
  colors: {
    background: "#E8F4FA",
    foreground: "#0A2E4A",
    surface: "#FFFFFF",
    primary: "#1A7BA8",
    onPrimary: "#FFFFFF",
    bubbleSent: "#1A7BA8",
    bubbleReceived: "#F0F7FC",
    textPrimary: "#0A2E4A",
    textSecondary: "#4A7A9B",
    accent: "#D4574B",
    border: "#C5DFED",
  },
};

export const paper: ThemeTokens = {
  id: "paper",
  name: "Giấy Note",
  colors: {
    background: "#F8F6F2",
    foreground: "#1C1C1A",
    surface: "#FFFFFF",
    primary: "#2C2C2A",
    onPrimary: "#FFFFFF",
    bubbleSent: "#2C2C2A",
    bubbleReceived: "#F0EEEA",
    textPrimary: "#1C1C1A",
    textSecondary: "#7A7A76",
    accent: "#C45A4A",
    border: "#E2E0DA",
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
  return getPresetTheme(themeId) ?? warmHome;
}
