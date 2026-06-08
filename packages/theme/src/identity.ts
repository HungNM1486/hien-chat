import type { PresetThemeId } from "./types.js";

export interface ThemeIdentity {
  id: PresetThemeId;
  tagline: string;
  mood: string;
  emoji: string;
  accentLabel: string;
}

export interface ThemeVisualExtras {
  shadowColor: string;
  bubbleSentEnd: string;
  radiusBubble: string;
  radiusCard: string;
}

export const themeIdentity: Record<PresetThemeId, ThemeIdentity> = {
  "warm-home": {
    id: "warm-home",
    tagline: "Hello Kitty · ấm cúng như nhà",
    mood: "Dễ thương, hồng pastel, nơ đỏ",
    emoji: "🎀",
    accentLabel: "Hồng Kitty",
  },
  midnight: {
    id: "midnight",
    tagline: "Hiên đêm · chuyện nhà dưới trăng",
    mood: "Charcoal ấm, terracotta, đêm yên",
    emoji: "🌙",
    accentLabel: "Terracotta đêm",
  },
  forest: {
    id: "forest",
    tagline: "Rừng xanh · hơi thở thiên nhiên",
    mood: "Lá xanh, rêu mát, trong lành",
    emoji: "🌿",
    accentLabel: "Xanh rừng",
  },
  ocean: {
    id: "ocean",
    tagline: "Đại dương · sóng nhẹ bờ xa",
    mood: "Xanh biển, trắng bọt, trong trẻo",
    emoji: "🌊",
    accentLabel: "Xanh biển",
  },
  paper: {
    id: "paper",
    tagline: "Giấy note · viết chuyện nhà",
    mood: "Kẻ dòng, mực đen, tối giản",
    emoji: "📝",
    accentLabel: "Mực & giấy",
  },
};

export const themeVisualExtras: Record<PresetThemeId, ThemeVisualExtras> = {
  "warm-home": {
    shadowColor: "255 105 157",
    bubbleSentEnd: "#e85a8a",
    radiusBubble: "20px",
    radiusCard: "20px",
  },
  midnight: {
    shadowColor: "24 28 26",
    bubbleSentEnd: "#9a5040",
    radiusBubble: "18px",
    radiusCard: "18px",
  },
  forest: {
    shadowColor: "20 50 38",
    bubbleSentEnd: "#2d6348",
    radiusBubble: "18px",
    radiusCard: "16px",
  },
  ocean: {
    shadowColor: "26 90 130",
    bubbleSentEnd: "#156088",
    radiusBubble: "19px",
    radiusCard: "18px",
  },
  paper: {
    shadowColor: "40 40 38",
    bubbleSentEnd: "#1a1a18",
    radiusBubble: "14px",
    radiusCard: "12px",
  },
};

export function getThemeIdentity(id: string): ThemeIdentity | undefined {
  return themeIdentity[id as PresetThemeId];
}

export function getThemeVisualExtras(id: string): ThemeVisualExtras | undefined {
  return themeVisualExtras[id as PresetThemeId];
}
