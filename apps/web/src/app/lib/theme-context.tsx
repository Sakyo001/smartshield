"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with "dark" so server and client initial renders match.
  // localStorage sync happens in useEffect after hydration completes.
  const [theme, setTheme] = useState<Theme>("dark");

  // Sync with saved preference on first mount (runs client-only, after hydration)
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && saved !== "dark") {
      setTheme(saved);
    }
  }, []);

  // Keep <html> class in sync on every theme change
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
