import { useRef } from "react";
import { gsap, useGSAP, motionOK } from "../lib/gsap";

/** Rolls a number from its previous value to `value` (GSAP). Renders the plain number without motion. */
export default function CountUp({ value = 0, className = "" }) {
  const ref = useRef(null);
  const shown = useRef(0);

  useGSAP(
    () => {
      const el = ref.current;
      if (!motionOK()) {
        el.textContent = value;
        shown.current = value;
        return;
      }
      const counter = { n: shown.current };
      gsap.to(counter, {
        n: value,
        duration: 0.4,
        ease: "power2.out",
        snap: { n: 1 },
        onUpdate: () => {
          el.textContent = counter.n;
          shown.current = counter.n;
        },
      });
    },
    { dependencies: [value], scope: ref }
  );

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value}
    </span>
  );
}
