import { useRef } from "react";
import { gsap, SplitText, useGSAP, motionOK } from "../lib/gsap";
import { useI18n } from "../lib/i18n";

/**
 * Animates a piece of text in, word by word or letter by letter (GSAP SplitText).
 * Only `transform` and `opacity` are animated (no blur, no 3D) so it stays smooth on any machine.
 *
 * Props
 *  - as       tag to render (default "span")
 *  - by       "words" (default) | "chars"
 *  - scroll   true (default): plays when scrolled into view · false: plays on mount
 *  - delay    seconds
 *  - stagger  seconds between words / letters
 *
 * Arabic is always split by words: its letters are joined, and cutting them apart would break the script.
 * To replay when the text changes, give it a `key` (see BrowseItems title).
 * The text is restored to plain DOM when the animation ends; screen readers always get the full sentence.
 */
export default function SplitReveal({
  as: Tag = "span",
  by = "words",
  scroll = true,
  delay = 0,
  stagger,
  className = "",
  children,
  ...rest
}) {
  const ref = useRef(null);
  const { isRTL } = useI18n();

  useGSAP(
    () => {
      if (!motionOK()) return;
      const el = ref.current;
      const chars = by === "chars" && !isRTL;
      const split = SplitText.create(el, { type: chars ? "words,chars" : "words" });

      gsap.from(chars ? split.chars : split.words, {
        y: chars ? "0.45em" : "0.55em",
        opacity: 0,
        duration: chars ? 0.45 : 0.55,
        ease: "power3.out",
        stagger: stagger ?? (chars ? 0.018 : 0.045),
        delay,
        scrollTrigger: scroll ? { trigger: el, start: "top 90%", once: true } : undefined,
        onComplete: () => split.revert(),
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
