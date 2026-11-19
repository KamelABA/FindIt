import { useRef } from "react";
import { flushSync } from "react-dom";
import Icon from "./Icon";
import { gsap, useGSAP, motionOK } from "../lib/gsap";
import { setTheme, useTheme } from "../lib/theme";
import { useI18n } from "../lib/i18n";

/**
 * Sun / moon switch. The new theme spreads as a circle from the button (View Transitions API);
 * browsers without it, and visitors who asked for reduced motion, get an instant switch.
 */
export default function ThemeToggle({ className = "" }) {
  const { t } = useI18n();
  const theme = useTheme();
  const isDark = theme === "dark";
  const button = useRef(null);
  const first = useRef(true);

  // the icon spins in each time the theme changes (not on first render)
  useGSAP(
    () => {
      if (first.current) {
        first.current = false;
        return;
      }
      if (!motionOK()) return;
      gsap.fromTo(
        "svg",
        { rotation: isDark ? -90 : 90, scale: 0.4, opacity: 0 },
        { rotation: 0, scale: 1, opacity: 1, duration: 0.45, ease: "power3.out" }
      );
    },
    { dependencies: [isDark], scope: button }
  );

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    if (!document.startViewTransition || !motionOK()) {
      setTheme(next);
      return;
    }
    const r = button.current.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(() => flushSync(() => setTheme(next)));
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 500, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
        );
      })
      .catch(() => {}); // transition skipped (tab hidden, another one started): the theme is applied anyway
  };

  const label = isDark ? t("theme.toLight") : t("theme.toDark");

  return (
    <button
      ref={button}
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={`btn-icon ${className}`}
    >
      <Icon name={isDark ? "sun" : "moon"} />
    </button>
  );
}
