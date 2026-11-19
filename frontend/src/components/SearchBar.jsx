import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { gsap, useGSAP, motionOK } from "../lib/gsap";
import { useI18n } from "../lib/i18n";

/**
 * Reusable search bar.
 * - Without `onSearch`: navigates to /items?q=...  (used on the Home page)
 * - With `onSearch(term)`: lets the parent handle the search (used on the Browse page)
 * - `rotatingWords`: optional list; the empty field then shows "Search for <word>" with the word
 *   rolling through the list (GSAP). Falls back to the normal placeholder under reduced motion.
 * Texts are translated; `placeholder` can still be overridden.
 */
export default function SearchBar({ initialValue = "", onSearch, placeholder, rotatingWords, size = "lg", className = "" }) {
  const { t } = useI18n();
  const [term, setTerm] = useState(initialValue);
  const [ticker, setTicker] = useState(false);
  const tickerRef = useRef(null);
  const navigate = useNavigate();
  const id = useId();
  const lg = size === "lg";
  const wordCount = rotatingWords?.length ?? 0;

  useEffect(() => {
    setTicker(wordCount > 0 && motionOK());
  }, [wordCount]);

  useGSAP(
    () => {
      if (!ticker) return;
      const words = gsap.utils.toArray("[data-word]", tickerRef.current);
      gsap.set(words, { yPercent: 110, opacity: 0 });
      const tl = gsap.timeline({ repeat: -1, delay: 1.2 });
      words.forEach((word) => {
        tl.to(word, { yPercent: 0, opacity: 1, duration: 0.4, ease: "power3.out" }).to(
          word,
          { yPercent: -110, opacity: 0, duration: 0.28, ease: "power2.in" },
          "+=1.4"
        );
      });
    },
    { dependencies: [ticker], scope: tickerRef }
  );

  const submit = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (onSearch) return onSearch(q);
    navigate(q ? `/items?q=${encodeURIComponent(q)}` : "/items");
  };

  return (
    <form onSubmit={submit} role="search" className={`relative flex w-full ${className}`}>
      <label htmlFor={id} className="sr-only">{t("search.label")}</label>
      <Icon
        name="search"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${lg ? "start-5 h-5 w-5" : "start-4 h-4 w-4"}`}
      />
      <input
        id={id}
        type="search"
        name="q"
        autoComplete="off"
        enterKeyHint="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={ticker ? "" : placeholder ?? t("search.placeholder")}
        className={`w-full rounded-full border border-ink/15 bg-surface text-ink transition duration-200 placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 ${
          lg ? "py-4 ps-13 pe-32 text-base shadow-[0_14px_34px_-22px_rgba(0,0,0,0.45)]" : "py-2.5 ps-11 pe-24 text-sm"
        }`}
      />

      {/* Rolling placeholder (decorative; the real label is above) */}
      {ticker && (
        <span
          ref={tickerRef}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 end-28 flex items-center overflow-hidden whitespace-nowrap text-muted ${
            lg ? "start-13 text-base" : "start-11 text-sm"
          } ${term ? "invisible" : ""}`}
        >
          <span className="max-sm:hidden">{t("search.prefix")}&nbsp;</span>
          <span className="inline-grid overflow-hidden">
            {rotatingWords.map((word) => (
              <span key={word} data-word className="col-start-1 row-start-1 font-semibold text-ink">
                {word}
              </span>
            ))}
          </span>
        </span>
      )}

      <button
        type="submit"
        className={`btn btn-dark absolute top-1/2 -translate-y-1/2 ${lg ? "end-2" : "end-1 min-h-9! px-4! py-1.5!"}`}
      >
        {t("search.button")}
      </button>
    </form>
  );
}
