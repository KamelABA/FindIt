import { flushSync } from "react-dom";
import Icon from "./Icon";
import { motionOK } from "../lib/gsap";
import { useI18n } from "../lib/i18n";

/**
 * English ⇄ العربية. The new language wipes in from the side its text starts on
 * (View Transitions API); without it, or under reduced motion, the switch is instant.
 * - variant "icon" (default): round button for the nav bar, shows the other language's short name
 * - variant "button": full button with a globe and the language name (mobile menu)
 */
export default function LanguageSwitch({ variant = "icon", className = "" }) {
  const { lang, setLang, t } = useI18n();
  const next = lang === "ar" ? "en" : "ar";

  const toggle = () => {
    if (!document.startViewTransition || !motionOK()) {
      setLang(next);
      return;
    }
    const transition = document.startViewTransition(() => flushSync(() => setLang(next)));
    // Arabic comes in from the right, English from the left
    const from = next === "ar" ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [from, "inset(0 0 0 0)"] },
          { duration: 600, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      })
      .catch(() => {}); // transition skipped: the language is applied anyway
  };

  // label and aria text are written in the language the button switches TO
  const common = { type: "button", onClick: toggle, lang: next, "aria-label": t("lang.aria"), title: t("lang.label") };

  if (variant === "button") {
    return (
      <button {...common} className={`btn btn-ghost ${className}`}>
        <Icon name="globe" className="h-4 w-4" />
        {t("lang.label")}
      </button>
    );
  }

  return (
    <button {...common} className={`btn-icon text-sm font-bold ${className}`}>
      {t("lang.short")}
    </button>
  );
}
