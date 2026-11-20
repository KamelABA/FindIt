import { useId, useState } from "react";
import Icon from "../Icon";
import { useI18n } from "../../lib/i18n";

const SMALL = "min-h-9! px-3.5! py-1.5! text-[13px]!";
const VARIANT = { primary: "btn-primary", dark: "btn-dark", ghost: "btn-ghost" };

/**
 * Row of action buttons. An action with `confirm` asks first, in place (no browser dialog),
 * and can collect a reason that is saved in the activity log.
 *
 * Props
 *  - actions   [{ key, label, icon?, variant?: "primary"|"dark"|"ghost", danger?,
 *                 confirm?: { text, note?: true, confirmLabel? } }]
 *  - onAction  (key, note) => void
 *  - busy      disables everything while a request runs
 */
export default function ActionBar({ actions, onAction, busy = false, className = "" }) {
  const { t } = useI18n();
  const [pending, setPending] = useState(null); // action waiting for confirmation
  const [note, setNote] = useState("");
  const noteId = useId();

  const visible = actions.filter(Boolean);
  if (!visible.length) return null;

  const click = (action) => {
    if (!action.confirm) return onAction(action.key, undefined);
    setNote("");
    setPending(action);
  };

  if (pending) {
    return (
      <div className={`rounded-xl border p-4 ${pending.danger ? "border-lost/30 bg-lost/[0.06]" : "border-ink/15 bg-ink/[0.03]"} ${className}`}>
        <p className="text-sm font-semibold text-ink">{pending.confirm.text}</p>
        {pending.confirm.note && (
          <>
            <label htmlFor={noteId} className="mt-3 block text-xs font-medium text-muted">
              {t("admin.actions.reason")}
            </label>
            <textarea
              id={noteId}
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full resize-none rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
            />
          </>
        )}
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button type="button" disabled={busy} onClick={() => setPending(null)} className={`btn btn-ghost ${SMALL}`}>
            {t("admin.actions.cancel")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              onAction(pending.key, note.trim() || undefined);
              setPending(null);
            }}
            className={`btn ${pending.danger ? "btn-primary" : "btn-dark"} ${SMALL}`}
          >
            {pending.confirm.confirmLabel ?? pending.label}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {visible.map((action) => (
        <button
          key={action.key}
          type="button"
          disabled={busy}
          onClick={() => click(action)}
          className={`btn ${VARIANT[action.variant ?? "ghost"]} ${SMALL} gap-1.5! disabled:opacity-50 ${action.danger && (action.variant ?? "ghost") === "ghost" ? "text-lost!" : ""}`}
        >
          {action.icon && <Icon name={action.icon} className="h-4 w-4" />}
          {action.label}
        </button>
      ))}
    </div>
  );
}

/** Inline message for a failed action */
export function ActionError({ error, onClose }) {
  const { t } = useI18n();
  if (!error) return null;
  return (
    <div role="alert" className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-lost/25 bg-lost/10 px-4 py-3 text-sm text-ink">
      <span>
        <strong className="font-semibold text-lost">{t("admin.actions.failed")}</strong> {error.message}
      </span>
      <button type="button" onClick={onClose} className="shrink-0 font-semibold text-muted hover:text-ink">
        {t("admin.actions.dismiss")}
      </button>
    </div>
  );
}
