"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";
type ThemeOrigin = { x: number; y: number };
type ThemeContextValue = {
  isTransitioning: boolean;
  mounted: boolean;
  theme: Theme;
  toggleTheme: (origin?: ThemeOrigin) => void;
};

const STORAGE_KEY = "munch-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";

    applyTheme(nextTheme);
    setThemeState(nextTheme);
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTransitioning) {
      return;
    }

    setThemeState((currentTheme) => {
      const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";

      window.localStorage.setItem(STORAGE_KEY, nextTheme);

      if (prefersReducedMotion) {
        setIsTransitioning(true);
        root.classList.add("theme-transition");
        applyTheme(nextTheme);
        window.setTimeout(() => {
          root.classList.remove("theme-transition");
          setIsTransitioning(false);
        }, 420);
        return nextTheme;
      }

      setIsTransitioning(true);
      root.classList.add("theme-transition");
      window.requestAnimationFrame(() => {
        applyTheme(nextTheme);
      });

      window.setTimeout(() => {
        root.classList.remove("theme-transition");
        setIsTransitioning(false);
      }, 420);

      return nextTheme;
    });
  }, [isTransitioning]);

  const value = useMemo(
    () => ({
      mounted,
      isTransitioning,
      theme,
      toggleTheme,
    }),
    [isTransitioning, mounted, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
