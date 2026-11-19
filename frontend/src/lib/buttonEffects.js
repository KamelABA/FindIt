// Site-wide button motion, installed once in App.jsx. The look is in index.css (".btn" section).
//
//  1. Ripple   – every `.btn` gets a soft ring growing from the exact point that was pressed.
//  2. Magnetic – a button marked `data-magnetic` leans a few pixels towards the pointer.
//
// Both are compositor-only: the ripple animates transform + opacity, and the magnetic pull only
// writes two CSS variables that the button's own `translate` transition smooths out.
// Nothing here runs for touch-only devices (magnetic) or under prefers-reduced-motion.
import { useEffect } from "react";
import { motionOK } from "./gsap";

const PULL = 7; // max pixels a magnetic button moves

export function useButtonEffects() {
  useEffect(() => {
    if (!motionOK()) return undefined;

    /* 1. ripple */
    const onDown = (e) => {
      const button = e.target.closest?.(".btn");
      if (!button || button.disabled) return;
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "btn-ripple";
      ripple.style.setProperty("--x", `${e.clientX - rect.left}px`);
      ripple.style.setProperty("--y", `${e.clientY - rect.top}px`);
      ripple.style.setProperty("--size", `${Math.max(rect.width, rect.height) * 2.4}px`);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
      button.appendChild(ripple);
    };
    document.addEventListener("pointerdown", onDown, { passive: true });

    /* 2. magnetic */
    let current = null;
    let rect = null;
    let frame = 0;
    let point = null;

    const release = () => {
      if (!current) return;
      current.style.removeProperty("--mx");
      current.style.removeProperty("--my");
      current = null;
    };
    const apply = () => {
      frame = 0;
      if (!current || !point) return;
      const x = ((point.x - rect.left) / rect.width - 0.5) * 2 * PULL;
      const y = ((point.y - rect.top) / rect.height - 0.5) * 2 * PULL;
      current.style.setProperty("--mx", `${x.toFixed(2)}px`);
      current.style.setProperty("--my", `${y.toFixed(2)}px`);
    };
    const onMove = (e) => {
      const target = e.target.closest?.("[data-magnetic]") ?? null;
      if (target !== current) {
        release();
        current = target;
        // measured once, at rest: measuring while it moves would make it chase itself
        rect = target ? target.getBoundingClientRect() : null;
      }
      if (!current) return;
      point = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const fine = window.matchMedia("(pointer: fine)").matches;
    if (fine) {
      document.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", release);
      window.addEventListener("scroll", release, { passive: true });
    }

    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", release);
      window.removeEventListener("scroll", release);
      cancelAnimationFrame(frame);
      release();
    };
  }, []);
}
