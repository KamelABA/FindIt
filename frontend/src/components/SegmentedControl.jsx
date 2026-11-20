import { useCallback, useEffect, useRef } from "react";
import Icon from "./Icon";
import { gsap, useGSAP, motionOK } from "../lib/gsap";

/**
 * Pill switcher: the dark highlight glides to the selected option (GSAP).
 * Used for the Lost / Found switch and the category chips; scrolls sideways when it doesn't fit.
 *
 * Props: options [{ value, label, icon? }], value, onChange(value), label (aria-label)
 */
export default function SegmentedControl({ options, value, onChange, label, className = "" }) {
  const root = useRef(null);
  const pill = useRef(null);
  const placed = useRef(false); // false until the pill has been positioned once

  const move = useCallback((animate) => {
    const active = root.current?.querySelector('[aria-pressed="true"]');
    if (!active || !pill.current) return;
    const to = { x: active.offsetLeft, width: active.offsetWidth };

    if (!animate || !placed.current || !motionOK()) {
      gsap.killTweensOf(pill.current); // a glide still running would land on the old size
      gsap.set(pill.current, { ...to, opacity: 1 });
      placed.current = true;
      return;
    }
    gsap.to(pill.current, { ...to, duration: 0.32, ease: "power3.out", overwrite: true });
    active.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, []);

  // Glide whenever the selected value changes
  useGSAP(() => move(true), { dependencies: [value, options.length], scope: root });

  // Keep it glued to its option when sizes change (fonts loading, window resize)
  useEffect(() => {
    const ro = new ResizeObserver(() => move(false));
    ro.observe(root.current);
    return () => ro.disconnect();
  }, [move]);

  return (
    <div
      className={`max-w-full overflow-x-auto rounded-full border border-ink/15 bg-surface [scrollbar-width:none] ${className}`}
    >
      <div ref={root} className="relative inline-flex p-1" role="group" aria-label={label}>
        <span
          ref={pill}
          className="pointer-events-none absolute bottom-1 left-0 top-1 rounded-full bg-brand-500 opacity-0 will-change-transform"
          aria-hidden="true"
        />
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`relative z-10 inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors duration-200 ${
                active ? "text-white" : "text-ink-2 hover:text-ink"
              }`}
            >
              {o.icon && <Icon name={o.icon} className="h-4 w-4" />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
