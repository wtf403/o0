import { useState, useEffect } from "react";

const themes = ["light", "dark", "auto"] as const;
type Theme = (typeof themes)[number];

const themeIcons: Record<Theme, string> = {
  light: "light-icon.png",
  dark: "dark-icon.png",
  auto: "auto-icon.png",
};

export default function Popup(): JSX.Element {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme) || "light";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (currentTheme: Theme) => {
    const root = document.documentElement;

    if (currentTheme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      root.classList.toggle("dark", prefersDark);
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
          setTheme("auto");
          applyTheme("auto");
        });
    } else {
      root.classList.toggle("dark", currentTheme === "dark");
    }
  };

  const switchTheme = () => {
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 text-center h-full p-3 bg-gray-800">
      <header className="flex flex-col items-center justify-center text-white">
        <h1>Safari Reading List</h1>
        <p>v0.0.1</p>
        <div>
          <a
            href="https://github.com/wtf403/safari-reading-list"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src="github-icon.png" alt="GitHub" />
          </a>
          <button onClick={switchTheme}>
            <img src={themeIcons[theme]} alt={`${theme} theme`} />
          </button>
        </div>
        <div className="flex flex-row gap-2">
          <a
            className="text-blue-400"
            href="src/pages/options/index.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Options
          </a>
        </div>
      </header>
    </div>
  );
}
