import { Link } from "react-router-dom";
import Icon from "../Icon";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Stat tile: label · value · optional hint, icon and link.
 * `accent` paints it brand red (use it for the ONE number that needs attention on a page).
 */
export default function StatCard({ label, value, hint, icon, to, accent = false, className = "" }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm font-semibold ${accent ? "text-white/85" : "text-ink-2"}`}>{label}</p>
        {icon && (
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
              accent ? "bg-white/15 text-white" : "bg-ink/[0.06] text-ink-2"
            }`}
          >
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className={`mt-2 text-4xl font-bold tracking-tight ${accent ? "text-white" : "text-ink"}`}>
        {value == null ? "—" : value >= 10000 ? compact.format(value) : value.toLocaleString("en")}
      </p>
      {(hint || to) && (
        <p className={`mt-1 flex items-center justify-between gap-2 text-xs ${accent ? "text-white/80" : "text-muted"}`}>
          <span>{hint}</span>
          {to && <Icon name="arrow" className={`h-4 w-4 shrink-0 rtl:-scale-x-100 ${accent ? "text-white" : "text-brand-ink"}`} />}
        </p>
      )}
    </>
  );

  const classes = `flex flex-col rounded-2xl border p-5 transition ${
    accent ? "border-transparent bg-brand-500" : "border-ink/10 bg-surface"
  } ${to ? "hover:-translate-y-0.5 hover:border-ink/25" : ""} ${className}`;

  return to ? (
    <Link to={to} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
