import { Link } from "react-router-dom";
import ItemStatusBadge from "./ItemStatusBadge";
import Icon from "./Icon";
import { getCategory, categoryLabel } from "../constants/categories";
import { formatDate } from "../utils";
import { useI18n } from "../lib/i18n";

/**
 * Reusable item card – used on Home, Browse, Profile ("My reports"), Admin…
 *
 * Props
 *  - item        normalized item (see services/itemsApi.js → normalizeItem)
 *  - variant     "grid" (default) | "list" | "compact"
 *  - showStatus  show the Lost/Found badge (default true)
 *  - showDate    show publication date (default true)
 *  - to          link target (default /items/:id). Pass null to disable the link.
 *  - onClick     optional click handler (e.g. open a modal instead of navigating)
 *  - actions     optional JSX rendered at the bottom (e.g. Edit / Delete / Approve buttons)
 *  - className   extra classes
 *
 * Works in English and Arabic (RTL): the category, the badge and the date are translated;
 * the title, description and location are shown as the publisher wrote them.
 */
export default function ItemCard({
  item,
  variant = "grid",
  showStatus = true,
  showDate = true,
  to,
  onClick,
  actions,
  className = "",
}) {
  const { t, dateLocale } = useI18n();
  if (!item) return null;
  const category = getCategory(item.category);
  const href = to === undefined ? `/items/${item.id}` : to;
  const cover = item.images?.[0];

  const Wrapper = href ? Link : "div";
  const wrapperProps = href ? { to: href } : {};

  const layout = {
    grid: "flex flex-col",
    list: "flex flex-col sm:flex-row",
    compact: "flex flex-row items-center",
  }[variant];

  const imageBox = {
    grid: "aspect-[4/3] w-full",
    list: "aspect-[4/3] w-full sm:w-56 sm:shrink-0",
    compact: "ms-2 h-16 w-16 shrink-0 rounded-xl",
  }[variant];

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-ink/10 bg-surface transition duration-300 ease-out-expo hover:-translate-y-1 hover:border-ink/25 hover:shadow-[0_22px_40px_-24px_rgba(0,0,0,0.55)] ${className}`}
    >
      <Wrapper {...wrapperProps} onClick={onClick} className={`${layout} h-full`}>
        {/* Image */}
        <div className={`relative overflow-hidden bg-paper-2 ${imageBox}`}>
          {cover ? (
            <img
              src={cover}
              alt={item.title}
              loading="lazy"
              decoding="async"
              width="800"
              height="600"
              className="h-full w-full object-cover transition duration-500 ease-out-expo group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-ink/25">
              <Icon name={category.icon} className={variant === "compact" ? "h-7 w-7" : "h-14 w-14"} strokeWidth={1.25} />
            </div>
          )}
          {showStatus && variant !== "compact" && (
            <ItemStatusBadge type={item.type} className="absolute start-3 top-3 bg-surface! shadow-sm" />
          )}
        </div>

        {/* Body */}
        <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${variant === "compact" ? "px-3 py-2" : "p-4"}`}>
          <div className="eyebrow flex items-center gap-1.5 text-muted">
            <Icon name={category.icon} className="h-3.5 w-3.5" />
            {categoryLabel(t, item.category)}
            {showStatus && variant === "compact" && <ItemStatusBadge type={item.type} className="ms-auto" />}
          </div>

          <h3
            dir="auto"
            className={`font-semibold leading-snug text-ink ${
              variant === "compact" ? "line-clamp-1 text-sm" : "line-clamp-2 text-[17px]"
            }`}
          >
            {item.title}
          </h3>

          {variant === "list" && item.description && (
            <p dir="auto" className="line-clamp-2 text-sm text-muted">{item.description}</p>
          )}

          {variant !== "compact" && (
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink/[0.07] pt-3 text-xs text-muted">
              {item.location && (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Icon name="pin" className="h-3.5 w-3.5 shrink-0" />
                  <span dir="auto" className="truncate">{item.location}</span>
                </span>
              )}
              {showDate && (
                <span className="ms-auto inline-flex shrink-0 items-center gap-1.5 tabular-nums">
                  {formatDate(item.createdAt, dateLocale)}
                </span>
              )}
            </div>
          )}
        </div>
      </Wrapper>

      {actions && <div className="flex gap-2 border-t border-ink/10 p-3">{actions}</div>}
    </article>
  );
}

/** Skeleton placeholder shown while items are loading */
export function ItemCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-ink/10 bg-surface">
      <div className="aspect-[4/3] bg-paper-2" />
      <div className="space-y-2.5 p-4">
        <div className="h-2.5 w-1/3 rounded bg-paper-2" />
        <div className="h-4 w-3/4 rounded bg-ink/10" />
        <div className="h-3 w-1/2 rounded bg-paper-2" />
      </div>
    </div>
  );
}
