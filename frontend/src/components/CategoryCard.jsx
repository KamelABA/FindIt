import { Link } from "react-router-dom";
import Icon from "./Icon";
import { categoryLabel, categoryDescription } from "../constants/categories";
import { useI18n } from "../lib/i18n";

/**
 * Props: category { slug, icon }, count (optional), featured (dark, wider tile)
 * Clicking opens /items?category=<slug>. Label and description are translated.
 */
export default function CategoryCard({ category, count, featured = false, className = "" }) {
  const { t } = useI18n();
  const description = categoryDescription(t, category.slug);
  const tone = featured
    ? "border-coal-900 bg-coal-900 text-white hover:bg-coal-800 dark:border-white/15 dark:bg-coal-800 dark:hover:bg-coal-700"
    : "border-ink/10 bg-surface text-ink hover:border-brand-500/50";

  return (
    <Link
      to={`/items?category=${category.slug}`}
      className={`group flex min-h-40 flex-col justify-between rounded-2xl border p-5 transition duration-300 ease-out-expo hover:-translate-y-1 hover:shadow-[0_20px_36px_-22px_rgba(0,0,0,0.5)] ${tone} ${className}`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl transition duration-300 ease-out-expo group-hover:scale-110 group-hover:-rotate-6 ${
            featured ? "bg-white/10 text-brand-300" : "bg-paper text-ink-2 group-hover:bg-brand-500 group-hover:text-white"
          }`}
        >
          <Icon name={category.icon} className="h-5.5 w-5.5" />
        </span>
        <Icon
          name="arrow-up-right"
          className={`h-5 w-5 transition duration-300 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 ${
            featured ? "text-white/50 group-hover:text-brand-300" : "text-ink/25 group-hover:text-brand-ink"
          }`}
        />
      </div>

      <div className="mt-6">
        <p className={featured ? "display text-2xl" : "font-semibold"}>{categoryLabel(t, category.slug)}</p>
        {description && <p className={`mt-1 text-sm ${featured ? "text-white/65" : "text-muted/90"}`}>{description}</p>}
        {typeof count === "number" && (
          <p className={`mt-2 text-xs font-semibold tabular-nums ${featured ? "text-brand-300" : "text-brand-ink"}`}>
            {t("items", count)}
          </p>
        )}
      </div>
    </Link>
  );
}
