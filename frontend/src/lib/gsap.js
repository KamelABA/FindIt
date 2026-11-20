// One place that registers GSAP + plugins. Import everything motion-related from here.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, useGSAP);

/** false when the visitor asked the system for reduced motion: then nothing animates. */
export const motionOK = () =>
  typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Resolves when every <img> inside `root` is loaded and decoded, or after `maxWait` ms, whichever
 * comes first. Start an entrance after this: decoding pictures in the middle of a movement is what
 * makes it stutter.
 */
export function imagesReady(root, maxWait = 500) {
  const images = root ? [...root.querySelectorAll("img")] : [];
  if (!images.length) return Promise.resolve();
  const decoded = (img) => {
    const decode = () => (img.decode ? img.decode().catch(() => {}) : undefined);
    if (img.complete) return Promise.resolve(decode());
    return new Promise((resolve) => {
      const done = () => resolve(decode());
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", resolve, { once: true });
    });
  };
  return Promise.race([Promise.all(images.map(decoded)), new Promise((resolve) => setTimeout(resolve, maxWait))]);
}

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP };
