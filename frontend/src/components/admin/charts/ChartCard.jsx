import { useState } from "react";
import Icon from "../../Icon";
import { useI18n } from "../../../lib/i18n";

/**
 * Frame shared by every chart: title, legend, and a chart / table switch
 * (the table is the accessible view of the same numbers).
 *
 * Props
 *  - title, subtitle
 *  - legend   [{ label, color, shape: "line" | "rect" }]   (give it for 2+ series; leave empty for one)
 *  - table    { columns: [string], rows: [[cell…]] }
 *  - busy     data reloading: the chart stays, dimmed
 *  - children the chart
 */
export default function ChartCard({ title, subtitle, legend = [], table, busy = false, children, className = "" }) {
  const { t } = useI18n();
  const [asTable, setAsTable] = useState(false);

  return (
    <section className={`viz flex flex-col rounded-2xl border border-ink/10 bg-surface p-5 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold text-ink-2 hover:text-ink"
          >
            <Icon name={asTable ? "chart" : "menu"} className="h-3.5 w-3.5" />
            {asTable ? t("admin.charts.showChart") : t("admin.charts.showTable")}
          </button>
        )}
      </header>

      {legend.length > 1 && !asTable && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
          {legend.map((item) => (
            <li key={item.label} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={item.shape === "line" ? "h-0.5 w-3.5 rounded-full" : "h-2.5 w-2.5 rounded-[3px]"}
                style={{ background: item.color }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <div className={`mt-4 flex-1 transition-opacity ${busy ? "opacity-50" : ""}`}>
        {asTable && table ? <DataGrid table={table} /> : children}
      </div>
    </section>
  );
}

function DataGrid({ table }) {
  return (
    <div className="max-h-80 overflow-auto rounded-xl border border-ink/10">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-ink/10">
            {table.columns.map((col, i) => (
              <th key={col} scope="col" className={`px-3 py-2 font-semibold text-muted ${i ? "text-end" : "text-start"}`}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row[0]} className="border-b border-ink/[0.07] last:border-0">
              {row.map((cell, i) => (
                <td key={i} className={`px-3 py-1.5 ${i ? "text-end tabular-nums text-ink" : "text-ink-2"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
