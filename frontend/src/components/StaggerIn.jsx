import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, motionOK, imagesReady } from "../lib/gsap";
import { useI18n } from "../lib/i18n";

// Only translate + opacity: cheap for the browser, so the motion stays smooth.
// "side" comes from the start of the line: the left in English, the right in Arabic.
const variants = (isRTL) => ({
  rise: { opacity: 0, y: 28 },
  deal: { opacity: 0, y: 40 },
  side: { opacity: 0, x: isRTL ? 20 : -20 },
});

/**
 * Staggers its DIRECT children in when the block scrolls into view (GSAP ScrollTrigger).
 * - It waits (max 0.5 s) for the pictures inside to be decoded, so nothing loads mid-movement.
 * - Wrap each child in a plain element: GSAP must not animate an element that has a CSS
 *   `transition` on transform (cards, buttons), or the two fight each other and the motion stutters.
 *
 * Props: as (tag), variant: "rise" | "deal" | "side", each (seconds between children),
 *        from: "start" | "center" | "end" | "edges" | "random" (stagger origin)
 */
export default function StaggerIn({
  as: Tag = "div",
  variant = "rise",
  each = 0.045,
  from = "start",
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);
  const { isRTL } = useI18n();

  useGSAP(
    (context, contextSafe) => {
      if (!motionOK()) return;
      const el = ref.current;
      const items = gsap.utils.toArray(el.children);
      if (!items.length) return;

      gsap.set(items, { ...variants(isRTL)[variant], willChange: "transform, opacity" });
      const play = contextSafe(() =>
        gsap.to(items, {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger: { each, from },
          clearProps: "transform,opacity,willChange",
        })
      );
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () => imagesReady(el).then(play),
      });
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
