import { useI18n } from "../../lib/i18n";

// Every status used in the dashboard → its tone. The text label always goes with the colour.
const TONE = {
  neutral: "bg-ink/[0.07] text-ink-2 ring-ink/15",
  good: "bg-found/15 text-found ring-found/25",
  bad: "bg-lost/10 text-lost ring-lost/25",
  dark: "bg-coal-900 text-white ring-coal-900 dark:bg-white dark:text-coal-900 dark:ring-white",
  brand: "bg-brand-500 text-white ring-brand-500",
};

const STATUS_TONE = {
  pending: "neutral",
  approved: "good",
  rejected: "bad",
  completed: "dark",
  open: "neutral",
  resolved: "good",
  archived: "dark",
  suspended: "bad",
  active: "good",
  student: "neutral",
  admin: "brand",
  super_admin: "dark",
};

/** status: a key of admin.status in the locales (pending, approved, resolved, suspended…) */
export default function StatusChip({ status, className = "" }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        TONE[STATUS_TONE[status] ?? "neutral"]
      } ${className}`}
    >
      {t(`admin.status.${status}`)}
    </span>
  );
}
