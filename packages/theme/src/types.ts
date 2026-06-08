export interface ThemeColors {
  background: string;
  foreground: string;
  surface: string;
  primary: string;
  onPrimary: string;
  bubbleSent: string;
  bubbleReceived: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
}

export interface ThemeTokens {
  id: string;
  name: string;
  colors: ThemeColors;
}

export type PresetThemeId =
  | "warm-home"
  | "midnight"
  | "forest"
  | "ocean"
  | "paper";

export type ThemeId = PresetThemeId | "system";

export type FontSizeOption = "normal" | "large" | "xlarge";

export const PRESET_THEME_IDS: PresetThemeId[] = [
  "warm-home",
  "midnight",
  "forest",
  "ocean",
  "paper",
];
