// English / Arabic. One small provider, no dependency.
//
//   const { t, lang, dir, isRTL, setLang } = useI18n();
//   t("nav.home")               → string
//   t("browse.results", 3)      → entries can be functions (plurals, interpolation)
//   t("search.words")           → entries can be arrays
//
// <html lang dir> is set here; the first paint is handled by the inline script in index.html.
// Layout rule for RTL: use logical Tailwind classes (ps-/pe-/ms-/me-/start-/end-/text-start),
// never pl-/pr-/ml-/mr-/left-/right-, and flip directional icons with `rtl:-scale-x-100`.
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import en from "../locales/en";
import ar from "../locales/ar";

export const LANG_KEY = "findit-lang";
const DICTIONARIES = { en, ar };
const DATE_LOCALE = { en: "en-GB", ar: "ar-DZ" }; // ar-DZ keeps Western digits

function initialLang() {
  if (typeof document === "undefined") return "en";
  const fromHtml = document.documentElement.lang; // set by the inline script in index.html
  return fromHtml === "ar" ? "ar" : "en";
}

function applyToDocument(lang) {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === "ar" ? "rtl" : "ltr";
}

function lookup(dictionary, key) {
  return key.split(".").reduce((node, part) => (node == null ? node : node[part]), dictionary);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  const setLang = useCallback((next) => {
    applyToDocument(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // storage blocked: the choice lasts for this visit
    }
    setLangState(next);
  }, []);

  const t = useCallback(
    (key, ...args) => {
      const value = lookup(DICTIONARIES[lang], key) ?? lookup(en, key);
      if (typeof value === "function") return value(...args);
      return value ?? key;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ t, lang, setLang, dir: lang === "ar" ? "rtl" : "ltr", isRTL: lang === "ar", dateLocale: DATE_LOCALE[lang] }),
    [t, lang, setLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside <I18nProvider>");
  return context;
}

/** Readable text for an error thrown by services/itemsApi.js */
export function errorText(t, error) {
  if (!error) return t("states.generic");
  if (error.code === "network") return t("states.network");
  if (error.status === 404) return t("states.notFound");
  if (error.status) return t("states.server", error.status);
  return error.message || t("states.generic");
}
