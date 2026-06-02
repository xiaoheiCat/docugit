export type UiTheme = "liquid" | "frosted";

export const DEFAULT_UI_THEME: UiTheme = "liquid";
export const UI_THEME_SETTING_KEY = "ui.theme";
export const UI_THEME_STORAGE_KEY = "docugit-desktop.uiTheme";

export function isUiTheme(value: string | null | undefined): value is UiTheme {
  return value === "liquid" || value === "frosted";
}

export function applyUiTheme(theme: UiTheme): void {
  document.documentElement.dataset.uiTheme = theme;
}

export function readLocalUiTheme(): UiTheme {
  const saved = localStorage.getItem(UI_THEME_STORAGE_KEY);
  return isUiTheme(saved) ? saved : DEFAULT_UI_THEME;
}

export async function resolveUiTheme(): Promise<UiTheme> {
  try {
    const stored = await window.docugitDesktop.getSetting(UI_THEME_SETTING_KEY);
    if (isUiTheme(stored)) {
      return stored;
    }
  } catch {
    // preload unavailable in tests
  }
  return readLocalUiTheme();
}

export function persistUiThemeLocal(theme: UiTheme): void {
  localStorage.setItem(UI_THEME_STORAGE_KEY, theme);
}
