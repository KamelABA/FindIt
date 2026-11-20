import { useI18n } from "../../lib/i18n";

/**
 * One row of filters above a table or charts. Wraps on small screens.
 * Props: children (SearchField, SegmentedControl, Select…), onClear (shows "Clear filters" when given)
 */
export default function FilterBar({ children, onClear, className = "" }) {
  const { t } = useI18n();
  return (
    <div className={`flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center ${className}`}>
      {children}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="self-start rounded-full px-3 py-2 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline lg:ms-auto lg:self-center"
        >
          {t("admin.table.clear")}
        </button>
      )}
    </div>
  );
}

/** Small labelled <select> for filters with many options (categories, actions, admins). */
export function SelectFilter({ label, value, onChange, options, className = "" }) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm text-muted ${className}`}>
      <span className="whitespace-nowrap font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-10 rounded-full border border-ink/15 bg-surface px-3 text-sm font-medium text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
