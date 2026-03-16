import React, { createContext, useContext, useEffect, useState } from "react";
import { storageService } from "~services/StorageService";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      let activeTheme: Theme = "light";
      try {
        const savedTheme = await storageService.get("theme");
        if (savedTheme === "dark" || savedTheme === "light") {
          activeTheme = savedTheme as Theme;
        } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          activeTheme = "dark";
        }
      } catch (err) {
        console.error("Failed to load theme:", err);
      } finally {
        setTheme(activeTheme);
        
        // Apply class IMMEDIATELY before signaling load completion
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(activeTheme);
        
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Apply theme to document body for Tailwind dark: classes
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Persist
    storageService.set("theme", theme);
  }, [theme, isLoaded]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {isLoaded ? children : null}
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
