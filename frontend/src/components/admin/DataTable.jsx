import { EmptyState, ErrorState } from "../StateMessages";
import { useI18n, errorText } from "../../lib/i18n";

const HIDE = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell" };

/**
 * Responsive table used by every management page.
 *
 * Props
 *  - columns     [{ key, header, render?(row), className?, hideBelow?: "sm"|"md"|"lg"|"xl" }]
 *                (hideBelow drops secondary columns on small screens; the row's drawer still shows them)
 *  - rows        array (null while the first load runs)
 *  - rowKey      (row) => key            default row.id
 *  - onRowClick  (row) => void           opens the details (row is focusable, Enter works too)
 *  - rowLabel    (row) => string         accessible name of a clickable row
 *  - loading, error, onRetry
 *  - empty       { title, text }
 *  - caption     screen-reader caption
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (row) => row.id,
  onRowClick,
  rowLabel,
  loading,
  error,
  onRetry,
  empty,
  caption,
}) {
  const { t } = useI18n();

  if (error && !rows) return <ErrorState message={errorText(t, error)} onRetry={onRetry} />;

  if (rows && rows.length === 0 && !loading) {
    return <EmptyState title={empty?.title ?? t("admin.table.emptyTitle")}>{empty?.text ?? t("admin.table.emptyText")}</EmptyState>;
  }

  return (
    <div className={`overflow-x-auto rounded-2xl border border-ink/10 bg-surface transition-opacity ${loading && rows ? "opacity-60" : ""}`} aria-busy={loading}>
      <table className="w-full text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-ink/10 bg-ink/[0.025]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`eyebrow whitespace-nowrap px-4 py-3 text-start font-semibold text-muted ${col.hideBelow ? HIDE[col.hideBelow] : ""} ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!rows &&
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-ink/[0.07] last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-4 ${col.hideBelow ? HIDE[col.hideBelow] : ""}`}>
                    <span className="block h-3 w-3/4 animate-pulse rounded bg-ink/10" />
                  </td>
                ))}
              </tr>
            ))}
          {rows?.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.target !== e.currentTarget) return; // a button inside the row handles its own keys
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
              className={`border-b border-ink/[0.07] last:border-0 ${
                onRowClick ? "cursor-pointer transition-colors hover:bg-ink/[0.035] focus-visible:bg-ink/[0.05] focus-visible:outline-none" : ""
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 align-middle ${col.hideBelow ? HIDE[col.hideBelow] : ""} ${col.className ?? ""}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
