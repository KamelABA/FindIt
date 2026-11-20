import { useCallback } from "react";
import ChartTooltip from "./ChartTooltip";
import { niceScale, formatCount, useActiveIndex, useElementWidth } from "./chartUtils";

const M = { top: 14, bottom: 26, left: 30 };
const END_LABEL_SPACE = 92;
const MIN_LABEL_GAP = 16;

/**
 * Lines over time (one axis, counts). 2px lines, end dots with a surface ring,
 * values labelled at the line ends when they don't collide, crosshair + tooltip on hover / arrows.
 *
 * Props
 *  - labels   x labels (e.g. week starts, already formatted)
 *  - series   [{ key, label, color, values: number[] }]
 *  - height   default 240
 *  - ariaLabel
 */
export default function LineChart({ labels, series, height = 240, ariaLabel }) {
  const [box, width] = useElementWidth();
  const n = labels.length;
  const right = END_LABEL_SPACE;
  const innerW = Math.max(0, width - M.left - right);
  const innerH = height - M.top - M.bottom;

  const { max, ticks } = niceScale(Math.max(0, ...series.flatMap((s) => s.values)));
  const x = (i) => M.left + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1));
  const y = (v) => M.top + innerH - (v / max) * innerH;

  const slotAt = useCallback(
    (px) => Math.min(n - 1, Math.max(0, Math.round(((px - M.left) / (innerW || 1)) * (n - 1)))),
    [n, innerW]
  );
  const { active, hitProps } = useActiveIndex(n, slotAt);

  // x labels: as many as fit (~60px each), always the last one
  const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / 60))));
  const shownX = labels.map((_, i) => i).filter((i) => (n - 1 - i) % every === 0);

  // direct end labels only when they don't touch each other (otherwise legend + tooltip carry it)
  const ends = series.map((s) => ({ s, value: s.values[n - 1] ?? 0, py: y(s.values[n - 1] ?? 0) }));
  const sortedY = ends.map((e) => e.py).sort((a, b) => a - b);
  const endLabels = sortedY.every((v, i) => i === 0 || v - sortedY[i - 1] >= MIN_LABEL_GAP);

  return (
    <div ref={box} className="relative" dir="ltr">
      {width > 0 && n > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
          {/* grid + y axis */}
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
          {/* x labels */}
          {shownX.map((i) => (
            <text key={i} x={x(i)} y={height - 6} textAnchor="middle" className="fill-muted text-[11px]">
              {labels[i]}
            </text>
          ))}

          {/* crosshair */}
          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={M.top} y2={M.top + innerH} stroke="var(--viz-axis)" strokeWidth="1" shapeRendering="crispEdges" />
          )}

          {/* lines */}
          {series.map((s) => (
            <path
              key={s.key}
              d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* end dots (or the hovered position) with a surface ring */}
          {series.map((s) => {
            const i = active ?? n - 1;
            return <circle key={s.key} cx={x(i)} cy={y(s.values[i] ?? 0)} r="4" fill={s.color} stroke="var(--color-surface)" strokeWidth="2" />;
          })}

          {/* direct labels at the line ends */}
          {endLabels &&
            ends.map(({ s, value, py }) => (
              <text key={s.key} x={x(n - 1) + 10} y={py} dy="0.32em" className="fill-ink-2 text-[11px] font-semibold">
                {formatCount(value)} <tspan className="fill-muted font-medium">{s.label}</tspan>
              </text>
            ))}

          {/* hit layer: the whole plot, so the pointer only needs the right date */}
          <rect
            x={M.left - 10}
            y={M.top}
            width={innerW + 20}
            height={innerH}
            fill="transparent"
            className="cursor-crosshair focus:outline-none"
            {...hitProps}
          />
        </svg>
      )}

      {active !== null && (
        <ChartTooltip
          x={x(active)}
          y={Math.min(...series.map((s) => y(s.values[active] ?? 0)))}
          width={width}
          title={labels[active]}
          rows={series.map((s) => ({ label: s.label, value: formatCount(s.values[active]), color: s.color }))}
        />
      )}
    </div>
  );
}
