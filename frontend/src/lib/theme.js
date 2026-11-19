// Light / dark theme. The `dark` class on <html> drives everything (see index.css).
// The first paint is handled by the small inline script in index.html, so there is no flash.
import { useEffect, useState } from "react";

export const THEME_KEY = "findit-theme";
const EVENT = "findit:theme-changed";
const BAR_COLOR = { light: "#fafafa", dark: "#0e0e0f" }; // browser / app title bar

export function getTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Applies the theme to the page and remembers it. */
export function setTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BAR_COLOR[theme]);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // storage blocked: the choice simply lasts for this visit
  }
  window.dispatchEvent(new Event(EVENT));
}

/** React hook: current theme, kept in sync across every toggle on the page. */
export function useTheme() {
  const [theme, setState] = useState(getTheme);

  useEffect(() => {
    const update = () => setState(getTheme());
    update();
    window.addEventListener(EVENT, update);
    return () => window.removeEventListener(EVENT, update);
  }, []);

  return theme;
}
