import React, { createContext, useContext, useEffect, useState } from "react";
import { storageService } from "~services/StorageService";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Load persisted theme
    const loadTheme = async () => {
      const savedTheme = await storageService.get("theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme as Theme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        // Fallback to system preference
        setTheme("dark");
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    // Apply theme to document body for Tailwind dark: classes
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Persist
    storageService.set("theme", theme);
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
