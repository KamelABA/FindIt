import { useI18n } from "../../../lib/i18n";

/**
 * Floating readout. Values lead (strong), series names follow (secondary);
 * each row is keyed with a short stroke of the series colour.
 *
 * Props: x, y (px inside the chart box), width (of the chart box, to stay inside it), title, rows [{ label, value, color }]
 */
export default function ChartTooltip({ x, y, width, title, rows }) {
  const { dir } = useI18n();
  const half = 84;
  const left = Math.min(Math.max(x, half), Math.max(half, width - half));

  return (
    <div
      role="status"
      dir={dir}
      className="pointer-events-none absolute z-10 min-w-36 -translate-x-1/2 -translate-y-full rounded-xl border border-ink/10 bg-surface px-3 py-2 text-xs shadow-[0_12px_30px_-12px_rgba(0,0,0,0.45)]"
      style={{ left, top: y - 10 }}
    >
      {title && <p className="mb-1 font-semibold text-muted">{title}</p>}
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2">
            {row.color && <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: row.color }} aria-hidden="true" />}
            <strong className="font-bold tabular-nums text-ink">{row.value}</strong>
            <span className="text-ink-2">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
