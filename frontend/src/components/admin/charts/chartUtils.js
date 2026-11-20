import { useCallback, useLayoutEffect, useRef, useState } from "react";

/** Width of an element, kept up to date (charts are drawn to the pixel). */
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** Clean axis for counts: a round maximum and 3–5 integer ticks from 0. */
export function niceScale(maxValue, targetTicks = 4) {
  if (!(maxValue > 0)) return { max: 4, ticks: [0, 1, 2, 3, 4] };
  const rough = maxValue / targetTicks;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough));
  const max = Math.ceil(maxValue / step) * step;
  const ticks = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return { max, ticks };
}

export const formatCount = (n) => Number(n ?? 0).toLocaleString("en");

/**
 * Which data position is "active" (hovered or focused) on an x axis with `count` slots.
 * Gives the props for the hit layer: pointer snaps to the nearest slot, arrow keys move it.
 */
export function useActiveIndex(count, slotAt) {
  const [active, setActive] = useState(null);

  const onPointerMove = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setActive(slotAt(e.clientX - rect.left));
    },
    [slotAt]
  );

  const onKeyDown = useCallback(
    (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      setActive((i) => {
        const current = i ?? count - 1;
        if (e.key === "Home") return 0;
        if (e.key === "End") return count - 1;
        return Math.min(count - 1, Math.max(0, current + (e.key === "ArrowRight" ? 1 : -1)));
      });
    },
    [count]
  );

  return {
    active,
    hitProps: {
      onPointerMove,
      onPointerLeave: () => setActive(null),
      onFocus: () => setActive((i) => i ?? count - 1),
      onBlur: () => setActive(null),
      onKeyDown,
      tabIndex: 0,
    },
  };
}
