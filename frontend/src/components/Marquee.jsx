import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, motionOK } from "../lib/gsap";
import { useI18n } from "../lib/i18n";

/**
 * Endless band of words (the kinds of things people lose). Filled and outlined words alternate.
 * - moves towards the start of the line in both languages (left in English, right in Arabic)
 * - slows down while the pointer is over it, pauses while it is off screen
 * - one transform on one layer: no repaint, so it stays perfectly smooth
 * Decorative: hidden from screen readers. Static under prefers-reduced-motion.
 */
export default function Marquee({ words = [], className = "" }) {
  const root = useRef(null);
  const { isRTL } = useI18n();

  useGSAP(
    () => {
      if (!motionOK() || !words.length) return;
      const el = root.current;
      const loop = gsap.to("[data-track]", { xPercent: isRTL ? 50 : -50, duration: 36, ease: "none", repeat: -1 });

      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? loop.resume() : loop.pause()),
      });

      const slow = () => gsap.to(loop, { timeScale: 0.2, duration: 0.6, ease: "power2.out", overwrite: true });
      const normal = () => gsap.to(loop, { timeScale: 1, duration: 0.8, ease: "power2.out", overwrite: true });
      el.addEventListener("pointerenter", slow);
      el.addEventListener("pointerleave", normal);
      return () => {
        el.removeEventListener("pointerenter", slow);
        el.removeEventListener("pointerleave", normal);
      };
    },
    { scope: root, dependencies: [isRTL, words.length] }
  );

  return (
    <div ref={root} aria-hidden="true" className={`marquee overflow-hidden border-y border-ink/10 py-5 ${className}`}>
      {/* two identical copies: moving by exactly half the track loops without a seam */}
      <div data-track className="flex w-max will-change-transform">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {words.map((word, i) => (
              <li key={word} className="flex items-center gap-8 px-4 sm:gap-10 sm:px-5">
                <span className={`display whitespace-nowrap text-2xl uppercase italic sm:text-4xl ${i % 2 ? "marquee-outline" : "text-ink"}`}>
                  {word}
                </span>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
