import { useCallback } from "react";
import ChartTooltip from "./ChartTooltip";
import { niceScale, formatCount, useActiveIndex, useElementWidth } from "./chartUtils";

const M = { top: 18, right: 8, bottom: 26, left: 30 };

/** Column with a 4px rounded top and a square base, growing from the baseline. */
function columnPath(x, y, w, h) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/**
 * One series of columns over time (≤ 24px wide). The tallest column carries its value on the cap;
 * every value is in the tooltip (hover / arrow keys) and in the table view.
 *
 * Props: labels, values, label (series name), color, height = 220, ariaLabel
 */
export default function ColumnChart({ labels, values, label, color, height = 220, ariaLabel }) {
  const [box, width] = useElementWidth();
  const n = labels.length;
  const innerW = Math.max(0, width - M.left - M.right);
  const innerH = height - M.top - M.bottom;
  const slot = n ? innerW / n : 0;
  const barW = Math.max(2, Math.min(24, slot * 0.6));

  const { max, ticks } = niceScale(Math.max(0, ...values));
  const y = (v) => M.top + innerH - (v / max) * innerH;
  const cx = (i) => M.left + slot * i + slot / 2;

  const slotAt = useCallback((px) => Math.min(n - 1, Math.max(0, Math.floor((px - M.left) / (slot || 1)))), [n, slot]);
  const { active, hitProps } = useActiveIndex(n, slotAt);

  const peak = values.length ? values.indexOf(Math.max(...values)) : -1;
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / 60))));

  return (
    <div ref={box} className="relative" dir="ltr">
      {width > 0 && n > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={M.left}
                x2={M.left + innerW}
                y1={y(tick)}
                y2={y(tick)}
                stroke={tick === 0 ? "var(--viz-axis)" : "var(--viz-grid)"}
                strokeWidth="1"
                shapeRendering="crispEdges"
              />
              <text x={M.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                {formatCount(tick)}
              </text>
            </g>
          ))}

          {values.map((v, i) => (
            <path
              key={i}
              d={columnPath(cx(i) - barW / 2, y(v), barW, y(0) - y(v))}
              fill={color}
              opacity={active === null || active === i ? 1 : 0.55}
            />
          ))}

          {peak >= 0 && values[peak] > 0 && (
            <text x={cx(peak)} y={y(values[peak]) - 6} textAnchor="middle" className="fill-ink-2 text-[11px] font-semibold">
              {formatCount(values[peak])}
            </text>
          )}

          {labels.map((text, i) =>
            (n - 1 - i) % every === 0 ? (
              <text key={i} x={cx(i)} y={height - 6} textAnchor="middle" className="fill-muted text-[11px]">
                {text}
              </text>
            ) : null
          )}

          <rect x={M.left} y={M.top} width={innerW} height={innerH} fill="transparent" className="focus:outline-none" {...hitProps} />
        </svg>
      )}

      {active !== null && (
        <ChartTooltip
          x={cx(active)}
          y={y(values[active] ?? 0)}
          width={width}
          title={labels[active]}
          rows={[{ label, value: formatCount(values[active]), color }]}
        />
      )}
    </div>
  );
}
