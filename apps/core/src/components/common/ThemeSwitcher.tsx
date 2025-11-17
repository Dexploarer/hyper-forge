/**
 * Theme Switcher Component
 * Allows users to toggle between light and dark themes
 * Persists preference in localStorage
 */

import { Monitor, Moon, Sun } from "lucide-react";
import React, { useEffect, useState } from "react";
import { cn } from "@/styles";

type Theme = "light" | "dark" | "system";

interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const THEME_STORAGE_KEY = "asset-forge-theme";

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className,
  showLabel = false,
  size = "md",
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get saved theme or default to system
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      return saved || "system";
    }
    return "system";
  });
  const [mounted, setMounted] = useState(false);

  // Get effective theme (system resolves to dark/light)
  const effectiveTheme =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  useEffect(() => {
    setMounted(true);
    applyTheme(effectiveTheme);

    // Listen for system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        applyTheme(mediaQuery.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, effectiveTheme]);

  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement;
    if (newTheme === "light") {
      root.classList.add("light-theme");
    } else {
      root.classList.remove("light-theme");
    }
  };

  const toggleTheme = () => {
    const themes: Theme[] = ["dark", "light", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="w-5 h-5" />;
    }
    if (effectiveTheme === "light") {
      return <Sun className="w-5 h-5" />;
    }
    return <Moon className="w-5 h-5" />;
  };

  const getLabel = () => {
    if (theme === "system") return "System";
    return effectiveTheme === "light" ? "Light" : "Dark";
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  if (!mounted) {
    // Prevent hydration mismatch
    return (
      <button
        className={cn("icon-btn", sizeClasses[size], className)}
        aria-label="Theme switcher"
        disabled
      >
        <Sun className="w-5 h-5 opacity-0" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "icon-btn",
        sizeClasses[size],
        "transition-all duration-300",
        "hover:scale-110 active:scale-95",
        className,
      )}
      aria-label={`Current: ${getLabel()}. Click to cycle themes.`}
      title={`Current theme: ${getLabel()}`}
    >
      {getIcon()}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">{getLabel()}</span>
      )}
    </button>
  );
};

/**
 * Hook to get current theme
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || "system";
    }
    return "system";
  });

  const effectiveTheme =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return {
    theme,
    effectiveTheme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    },
  };
};
