"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSettings, getToken, updateSettings } from "@/lib/api";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function persistThemeToBackend(theme: Theme) {
  if (!getToken()) return;

  getSettings()
    .then((settings) => updateSettings({ ...settings, theme }))
    .catch(() => {});
}

function initialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    // localStorage is the source of truth for this device — the user's last
    // explicit choice always wins on refresh. Only fall back to the backend
    // setting when this device has never had a theme chosen before.
    const stored = localStorage.getItem("cognexa_theme") as Theme | null;

    if (stored) {
      setThemeState(stored);
      applyTheme(stored);
      return;
    }

    if (getToken()) {
      getSettings()
        .then((settings) => {
          const remote = (settings.theme as Theme) ?? "dark";
          setThemeState(remote);
          localStorage.setItem("cognexa_theme", remote);
          applyTheme(remote);
        })
        .catch(() => applyTheme("dark"));
    } else {
      applyTheme("dark");
    }
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem("cognexa_theme", next);
    applyTheme(next);
    persistThemeToBackend(next);
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
