// Shared loading / error / empty states (texts are translated; props override them)
import Icon from "./Icon";
import { useI18n } from "../lib/i18n";

export function Spinner({ label }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted" role="status">
      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-ink/10 border-t-brand-500" />
      <span className="eyebrow">{label ?? t("states.loading")}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-lost/25 bg-surface p-8 text-center" role="alert">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lost/10 text-lost">
        <Icon name="alert" className="h-6 w-6" />
      </span>
      <p className="mt-4 font-semibold text-ink">{t("states.errorTitle")}</p>
      <p className="mt-1 text-sm text-muted">{message ?? t("states.generic")}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-dark mt-5">
          {t("states.retry")}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-ink/20 p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-2 text-ink-2">
        <Icon name="search" className="h-6 w-6" />
      </span>
      {title && <p className="mt-4 font-semibold text-ink">{title}</p>}
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}
