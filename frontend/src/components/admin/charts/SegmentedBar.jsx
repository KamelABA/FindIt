import { useRef, useState } from "react";
import ChartTooltip from "./ChartTooltip";
import { formatCount, useElementWidth } from "./chartUtils";

/**
 * One whole split into parts (tall segmented bar, 28px). Each block prints its share at its
 * leading edge when it fits; the legend lists the parts in block order with their counts.
 *
 * Props
 *  - parts  [{ key, label, value, color, ink }]   ink = text colour inside the block
 *  - label  accessible name of the whole bar
 */
export default function SegmentedBar({ parts, label }) {
  const [box, width] = useElementWidth();
  const wrap = useRef(null);
  const [tip, setTip] = useState(null);
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  const shown = parts.filter((p) => p.value > 0);
  const share = (p) => (total ? Math.round((p.value / total) * 100) : 0);

  const show = (e, p) => {
    const outer = wrap.current.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();
    setTip({
      x: rect.left + rect.width / 2 - outer.left,
      y: rect.top - outer.top,
      width: outer.width,
      rows: [{ label: p.label, value: `${formatCount(p.value)} · ${share(p)}%`, color: p.color }],
    });
  };

  return (
    <div ref={wrap} className="relative">
      <div ref={box} role="group" aria-label={label} className="flex h-7 gap-[2px]" onPointerLeave={() => setTip(null)}>
        {total === 0 ? (
          <span className="block h-full w-full rounded-[4px] bg-ink/[0.06]" />
        ) : (
          shown.map((p) => {
            const fits = (p.value / total) * width >= 44;
            return (
              <span
                key={p.key}
                tabIndex={0}
                aria-label={`${p.label}: ${formatCount(p.value)} (${share(p)}%)`}
                onPointerEnter={(e) => show(e, p)}
                onFocus={(e) => show(e, p)}
                onBlur={() => setTip(null)}
                className="flex h-full min-w-[3px] items-center rounded-[4px] ps-2 text-xs font-bold focus:outline-2 focus:outline-offset-2 focus:outline-ink"
                style={{ flexGrow: p.value, flexBasis: 0, background: p.color, color: p.ink ?? "#fff" }}
              >
                {fits && `${share(p)}%`}
              </span>
            );
          })
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
        {parts.map((p) => (
          <li key={p.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.color }} />
            {p.label}
            <strong className="font-semibold tabular-nums text-ink">{formatCount(p.value)}</strong>
          </li>
        ))}
      </ul>
      {tip && <ChartTooltip {...tip} />}
    </div>
  );
}
