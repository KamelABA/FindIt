import { useEffect, useId, useState } from "react";
import PageHeader from "../../components/admin/PageHeader";
import { ActionError } from "../../components/admin/ActionBar";
import { Spinner, ErrorState } from "../../components/StateMessages";
import { getSettings, updateSettings } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n, errorText } from "../../lib/i18n";
import { useAction, formatDateTime } from "./hooks";

/** Last change of one setting: "Changed 20 Nov 2026, 14:05 by …" */
function LastChange({ setting }) {
  const { t, dateLocale } = useI18n();
  if (!setting?.updated_at) return null;
  return (
    <p className="mt-2 text-xs text-muted">
      {t("admin.settings.lastChange", formatDateTime(setting.updated_at, dateLocale), setting.updated_by ?? "—")}
    </p>
  );
}

/**
 * Super admins: system settings (use case "System Settings").
 * Only settings the code really uses are listed; the backend validates every value
 * and records each change in the activity log.
 */
export default function SettingsPage() {
  const { t } = useI18n();
  const archiveId = useId();
  const contactId = useId();
  const { data, loading, error, retry } = useAsync((signal) => getSettings({ signal }), []);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const action = useAction(() => {
    retry();
    setSaved(true);
  });

  useEffect(() => {
    if (data) setForm({ archive_after_days: String(data.values.archive_after_days), show_publisher_contact: data.values.show_publisher_contact });
  }, [data]);

  const byKey = (key) => data?.list.find((s) => s.key === key);
  const dirty =
    form && data && (Number(form.archive_after_days) !== data.values.archive_after_days || form.show_publisher_contact !== data.values.show_publisher_contact);

  const save = (e) => {
    e.preventDefault();
    setSaved(false);
    action.run(() =>
      updateSettings({ archive_after_days: Number(form.archive_after_days), show_publisher_contact: form.show_publisher_contact })
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("admin.superOnly.badge")} title={t("admin.nav.settings")} subtitle={t("admin.settings.subtitle")} />

      {loading && !data && <Spinner />}
      {error && <ErrorState message={errorText(t, error)} onRetry={retry} />}

      {form && (
        <form onSubmit={save} className="max-w-2xl space-y-4">
          <ActionError error={action.error} onClose={action.clearError} />

          <section className="rounded-2xl border border-ink/10 bg-surface p-5">
            <label htmlFor={archiveId} className="font-bold text-ink">{t("admin.settings.archiveTitle")}</label>
            <p className="mt-1 text-sm text-muted">{t("admin.settings.archiveText")}</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                id={archiveId}
                type="number"
                min={1}
                max={3650}
                required
                value={form.archive_after_days}
                onChange={(e) => setForm((f) => ({ ...f, archive_after_days: e.target.value }))}
                className="w-28 rounded-xl border border-ink/15 bg-paper px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
              />
              <span className="text-sm text-ink-2">{t("admin.settings.days")}</span>
            </div>
            <LastChange setting={byKey("archive_after_days")} />
          </section>

          <section className="rounded-2xl border border-ink/10 bg-surface p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <label htmlFor={contactId} className="font-bold text-ink">{t("admin.settings.contactTitle")}</label>
                <p className="mt-1 text-sm text-muted">{t("admin.settings.contactText")}</p>
              </div>
              <input
                id={contactId}
                type="checkbox"
                role="switch"
                checked={form.show_publisher_contact}
                onChange={(e) => setForm((f) => ({ ...f, show_publisher_contact: e.target.checked }))}
                className="mt-1 h-5 w-5 shrink-0 accent-brand-500"
              />
            </div>
            <LastChange setting={byKey("show_publisher_contact")} />
          </section>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={!dirty || action.busy} className="btn btn-dark disabled:opacity-50">
              {t("admin.actions.save")}
            </button>
            {saved && !dirty && <p role="status" className="text-sm text-found">{t("admin.settings.saved")}</p>}
          </div>
        </form>
      )}
    </div>
  );
}
