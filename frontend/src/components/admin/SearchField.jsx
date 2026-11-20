import { useEffect, useId, useRef, useState } from "react";
import Icon from "../Icon";
import { useI18n } from "../../lib/i18n";

/**
 * Live search input for tables: calls onChange(term) 350 ms after the admin stops typing.
 * Props: value (current term), onChange, placeholder, className
 */
export default function SearchField({ value = "", onChange, placeholder, className = "" }) {
  const { t } = useI18n();
  const id = useId();
  const [term, setTerm] = useState(value);
  const latest = useRef(onChange);
  latest.current = onChange;

  // follow outside changes (e.g. "clear filters")
  useEffect(() => setTerm(value), [value]);

  useEffect(() => {
    if (term.trim() === value) return undefined;
    const timer = setTimeout(() => latest.current(term.trim()), 350);
    return () => clearTimeout(timer);
  }, [term, value]);

  return (
    <div className={`relative w-full sm:w-72 ${className}`}>
      <label htmlFor={id} className="sr-only">{placeholder ?? t("admin.table.search")}</label>
      <Icon name="search" className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        id={id}
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder ?? t("admin.table.search")}
        className="w-full rounded-full border border-ink/15 bg-surface py-2 ps-10 pe-4 text-sm text-ink transition placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
      />
    </div>
  );
}
