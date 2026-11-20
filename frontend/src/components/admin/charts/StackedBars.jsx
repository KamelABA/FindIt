import { useRef, useState } from "react";
import ChartTooltip from "./ChartTooltip";
import { formatCount } from "./chartUtils";

/**
 * Horizontal stacked bars, one row per category (HTML, so it follows the reading direction).
 * Segments are separated by a 2px gap, the bar end is rounded (4px), the base is square,
 * the row total sits at the tip. Each segment shows its value on hover / focus.
 *
 * Props
 *  - rows    [{ key, label, values: { [seriesKey]: number } }]
 *  - series  [{ key, label, color }]
 */
export default function StackedBars({ rows, series }) {
  const box = useRef(null);
  const [tip, setTip] = useState(null);
  const max = Math.max(1, ...rows.map((r) => series.reduce((sum, s) => sum + (r.values[s.key] ?? 0), 0)));

  const show = (e, row, s) => {
    const outer = box.current.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();
    setTip({
      x: rect.left + rect.width / 2 - outer.left,
      y: rect.top - outer.top,
      width: outer.width,
      title: row.label,
      rows: [{ label: s.label, value: formatCount(row.values[s.key]), color: s.color }],
    });
  };

  return (
    <div ref={box} className="relative" onPointerLeave={() => setTip(null)}>
      <ul className="space-y-2.5">
        {rows.map((row) => {
          const total = series.reduce((sum, s) => sum + (row.values[s.key] ?? 0), 0);
          const parts = series.filter((s) => (row.values[s.key] ?? 0) > 0);
          return (
            <li key={row.key} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm sm:grid-cols-[9rem_1fr]">
              <span className="truncate text-ink-2" title={row.label}>{row.label}</span>
              <div className="flex items-center gap-2">
                <div className="flex h-4 items-stretch gap-[2px]" style={{ width: `${(total / max) * 85}%` }}>
                  {parts.map((s, i) => (
                    <span
                      key={s.key}
                      tabIndex={0}
                      aria-label={`${row.label} · ${s.label}: ${formatCount(row.values[s.key])}`}
                      onPointerEnter={(e) => show(e, row, s)}
                      onFocus={(e) => show(e, row, s)}
                      onBlur={() => setTip(null)}
                      className={`block min-w-[3px] focus:outline-2 focus:outline-offset-2 focus:outline-ink ${i === parts.length - 1 ? "rounded-e-[4px]" : ""}`}
                      style={{ flexGrow: row.values[s.key], flexBasis: 0, background: s.color }}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold tabular-nums text-ink-2">{formatCount(total)}</span>
              </div>
            </li>
          );
        })}
      </ul>
      {tip && <ChartTooltip {...tip} />}
    </div>
  );
}
