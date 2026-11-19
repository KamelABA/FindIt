import { useRef } from "react";
import { gsap, useGSAP, motionOK } from "../lib/gsap";

// Each soft colour field drifts on its own slow path. Only `transform` is animated and every field
// has its own compositor layer, so the browser never repaints: this is what keeps it ultra smooth.
const FIELDS = [
  { tone: "ambient-red", className: "-start-[18vmax] -top-[22vmax] h-[62vmax] w-[62vmax]", to: { xPercent: 22, yPercent: 16, scale: 1.18 }, duration: 26 },
  { tone: "ambient-pink", className: "-end-[20vmax] top-[18vh] h-[56vmax] w-[56vmax]", to: { xPercent: -24, yPercent: 22, scale: 0.9 }, duration: 32 },
  { tone: "ambient-ink", className: "start-[18vw] -bottom-[26vmax] h-[60vmax] w-[60vmax]", to: { xPercent: 18, yPercent: -20, scale: 1.12 }, duration: 38 },
];

/**
 * Living page background: three blurred colour fields (brand red, accent pink, soft grey) and two
 * dashed "routes" that drift very slowly behind everything. Decorative, fixed, never interactive.
 * Static under prefers-reduced-motion.
 */
export default function AmbientBackground() {
  const root = useRef(null);

  useGSAP(
    () => {
      if (!motionOK()) return;
      gsap.utils.toArray("[data-field]", root.current).forEach((el, i) => {
        gsap.to(el, { ...FIELDS[i].to, duration: FIELDS[i].duration, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });
      gsap.to("[data-route]", { xPercent: 6, yPercent: -5, rotation: 4, duration: 30, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 6 });
    },
    { scope: root }
  );

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {FIELDS.map((f) => (
        <div key={f.tone} data-field className={`absolute rounded-full will-change-transform ${f.tone} ${f.className}`} />
      ))}

      <svg data-route viewBox="0 0 600 300" fill="none" className="absolute end-[4vw] top-[12vh] w-[46vmax] text-ink/[0.07] will-change-transform">
        <path d="M10 250C120 120 210 280 320 160S500 60 590 40" stroke="currentColor" strokeWidth="2.5" strokeDasharray="10 12" strokeLinecap="round" />
        <circle cx="590" cy="40" r="7" className="fill-brand-500/25" />
      </svg>
      <svg data-route viewBox="0 0 600 300" fill="none" className="absolute bottom-[10vh] start-[2vw] w-[40vmax] text-ink/[0.06] will-change-transform">
        <path d="M10 60C140 20 180 220 330 190S480 260 590 150" stroke="currentColor" strokeWidth="2.5" strokeDasharray="10 12" strokeLinecap="round" />
        <circle cx="10" cy="60" r="7" className="fill-brand-500/25" />
      </svg>
    </div>
  );
}
