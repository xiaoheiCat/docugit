import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_UI_THEME,
  UI_THEME_SETTING_KEY,
  applyUiTheme,
  persistUiThemeLocal,
  readLocalUiTheme,
  resolveUiTheme,
  type UiTheme,
} from "./ui-theme.ts";

interface UiThemeContextValue {
  theme: UiTheme;
  setTheme: (theme: UiTheme) => Promise<void>;
}

const UiThemeContext = createContext<UiThemeContextValue | null>(null);

export function UiThemeProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [theme, setThemeState] = useState<UiTheme>(readLocalUiTheme);

  useEffect(() => {
    applyUiTheme(theme);
  }, [theme]);

  useEffect(() => {
    void resolveUiTheme().then((resolved) => {
      setThemeState(resolved);
      applyUiTheme(resolved);
      persistUiThemeLocal(resolved);
    });
  }, []);

  const setTheme = useCallback(async (next: UiTheme) => {
    setThemeState(next);
    applyUiTheme(next);
    persistUiThemeLocal(next);
    await window.docugitDesktop.setSetting(UI_THEME_SETTING_KEY, next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <UiThemeContext.Provider value={value}>{children}</UiThemeContext.Provider>;
}

export function useUiTheme(): UiThemeContextValue {
  const ctx = useContext(UiThemeContext);
  if (!ctx) {
    return {
      theme: DEFAULT_UI_THEME,
      setTheme: async () => {},
    };
  }
  return ctx;
}
