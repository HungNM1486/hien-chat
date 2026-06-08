import type { FontSizeOption, ThemeTokens } from "./types.js";

const CSS_VAR_MAP: Record<keyof ThemeTokens["colors"], string> = {
  background: "--background",
  foreground: "--foreground",
  surface: "--surface",
  primary: "--primary",
  onPrimary: "--on-primary",
  bubbleSent: "--bubble-sent",
  bubbleReceived: "--bubble-received",
  textPrimary: "--text-primary",
  textSecondary: "--text-secondary",
  accent: "--accent",
  border: "--border",
};

export function themeToCssVariables(theme: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    vars[cssVar] = theme.colors[key as keyof ThemeTokens["colors"]];
  }
  return vars;
}

export function fontSizeToCssVariables(fontSize: FontSizeOption): Record<string, string> {
  switch (fontSize) {
    case "large":
      return {
        "--font-size-base": "20px",
        "--font-size-large": "24px",
        "--touch-target": "48px",
      };
    case "xlarge":
      return {
        "--font-size-base": "24px",
        "--font-size-large": "28px",
        "--touch-target": "52px",
      };
    default:
      return {
        "--font-size-base": "16px",
        "--font-size-large": "20px",
        "--touch-target": "44px",
      };
  }
}

export function applyThemeToElement(
  element: HTMLElement,
  theme: ThemeTokens,
  options?: {
    fontSize?: FontSizeOption;
    withTransition?: boolean;
  },
): void {
  const vars = {
    ...themeToCssVariables(theme),
    ...(options?.fontSize ? fontSizeToCssVariables(options.fontSize) : {}),
  };

  if (options?.withTransition === false) {
    element.classList.add("theme-no-transition");
  }

  for (const [key, value] of Object.entries(vars)) {
    element.style.setProperty(key, value);
  }

  element.dataset.theme = theme.id;

  if (options?.withTransition === false) {
    requestAnimationFrame(() => {
      element.classList.remove("theme-no-transition");
    });
  }
}

export function clearScopedTheme(element: HTMLElement): void {
  for (const cssVar of Object.values(CSS_VAR_MAP)) {
    element.style.removeProperty(cssVar);
  }
  delete element.dataset.theme;
}
