import React, { createContext, useContext, useEffect, useState } from "react";

export type MonkeytypeTheme =
  | "serika-dark"
  | "carbon"
  | "dracula"
  | "nord"
  | "matrix"
  | "olivia"
  | "serika-light";

export type CaretStyle = "line" | "block" | "underline" | "off";

export interface ThemeDefinition {
  id: MonkeytypeTheme;
  name: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  subColor: string;
  isDark: boolean;
}

export const MONKEYTYPE_THEMES: ThemeDefinition[] = [
  {
    id: "serika-dark",
    name: "Serika Dark",
    bgColor: "#323437",
    textColor: "#d1d0c5",
    accentColor: "#e2b714",
    subColor: "#646669",
    isDark: true,
  },
  {
    id: "carbon",
    name: "Carbon",
    bgColor: "#313131",
    textColor: "#f5e6c8",
    accentColor: "#e6a15c",
    subColor: "#616161",
    isDark: true,
  },
  {
    id: "dracula",
    name: "Dracula",
    bgColor: "#282a36",
    textColor: "#f8f8f2",
    accentColor: "#ff79c6",
    subColor: "#6272a4",
    isDark: true,
  },
  {
    id: "nord",
    name: "Nord",
    bgColor: "#2e3440",
    textColor: "#d8dee9",
    accentColor: "#88c0d0",
    subColor: "#4c566a",
    isDark: true,
  },
  {
    id: "matrix",
    name: "Matrix",
    bgColor: "#0d1117",
    textColor: "#00ff66",
    accentColor: "#00ff66",
    subColor: "#484f58",
    isDark: true,
  },
  {
    id: "olivia",
    name: "Olivia",
    bgColor: "#1e1e24",
    textColor: "#f2e9e4",
    accentColor: "#e8b4b8",
    subColor: "#78716c",
    isDark: true,
  },
  {
    id: "serika-light",
    name: "Serika Light",
    bgColor: "#e1e1e3",
    textColor: "#323437",
    accentColor: "#d19a1e",
    subColor: "#93928f",
    isDark: false,
  },
];

interface ThemeContextValue {
  theme: MonkeytypeTheme;
  setTheme: (theme: MonkeytypeTheme) => void;
  caretStyle: CaretStyle;
  setCaretStyle: (style: CaretStyle) => void;
  isDark: boolean;
  currentThemeDef: ThemeDefinition;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_THEME_KEY = "keyverse_mt_theme";
const STORAGE_CARET_KEY = "keyverse_mt_caret";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<MonkeytypeTheme>("serika-dark");
  const [caretStyle, setCaretStyleState] = useState<CaretStyle>("line");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) as MonkeytypeTheme | null;
    const legacyTheme = localStorage.getItem("theme");

    if (savedTheme && MONKEYTYPE_THEMES.some((t) => t.id === savedTheme)) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else if (legacyTheme === "light") {
      setThemeState("serika-light");
      applyTheme("serika-light");
    } else {
      setThemeState("serika-dark");
      applyTheme("serika-dark");
    }

    const savedCaret = localStorage.getItem(STORAGE_CARET_KEY) as CaretStyle | null;
    if (savedCaret && ["line", "block", "underline", "off"].includes(savedCaret)) {
      setCaretStyleState(savedCaret);
    }
  }, []);

  const applyTheme = (t: MonkeytypeTheme) => {
    if (typeof document === "undefined") return;
    const themeDef = MONKEYTYPE_THEMES.find((def) => def.id === t) || MONKEYTYPE_THEMES[0];
    
    // Apply data-theme on html root
    document.documentElement.setAttribute("data-theme", t);
    
    // Also toggle .dark class for compatibility
    if (themeDef.isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Set meta theme-color for mobile browser address bars
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", themeDef.bgColor);
  };

  const setTheme = (nextTheme: MonkeytypeTheme) => {
    setThemeState(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_THEME_KEY, nextTheme);
      const def = MONKEYTYPE_THEMES.find((t) => t.id === nextTheme);
      localStorage.setItem("theme", def?.isDark ? "dark" : "light");
    }
    applyTheme(nextTheme);
  };

  const setCaretStyle = (style: CaretStyle) => {
    setCaretStyleState(style);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_CARET_KEY, style);
    }
  };

  const currentThemeDef =
    MONKEYTYPE_THEMES.find((t) => t.id === theme) || MONKEYTYPE_THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        caretStyle,
        setCaretStyle,
        isDark: currentThemeDef.isDark,
        currentThemeDef,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
