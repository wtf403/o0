import React, { useEffect, useState } from "react";
import { Theme, ThemeContext } from "./ThemeContext";
import Browser from "webextension-polyfill";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    // Load saved theme
    Browser.storage.local.get("theme").then((result) => {
      if (result.theme) setTheme(result.theme as Theme);
    });
  }, []);

  useEffect(() => {
    // Save theme changes
    Browser.storage.local.set({ theme });

    // Apply theme
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.classList.toggle("dark", isDark);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
