import Icon from "../Icon";
import { useI18n } from "../../lib/i18n";

/** "21–40 of 132" with previous / next buttons. Hidden when everything fits on one page. */
export default function Pagination({ page, pageSize, total, onChange }) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize && page === 1) return null;

  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  const button =
    "btn-icon h-9! w-9! border border-ink/15 bg-surface text-ink-2 hover:text-ink disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav aria-label={t("admin.table.pagination")} className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
      <p className="tabular-nums">{t("admin.table.range", from, to, total)}</p>
      <div className="flex items-center gap-2">
        <button type="button" className={button} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t("admin.table.previous")}>
          <Icon name="chevron-left" className="h-4 w-4 rtl:-scale-x-100" />
        </button>
        <span className="tabular-nums">{t("admin.table.page", page, pages)}</span>
        <button type="button" className={button} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label={t("admin.table.next")}>
          <Icon name="chevron-right" className="h-4 w-4 rtl:-scale-x-100" />
        </button>
      </div>
    </nav>
  );
}
