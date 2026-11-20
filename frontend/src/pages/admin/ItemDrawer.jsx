import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Drawer, { DetailRow, DrawerSection } from "../../components/admin/Drawer";
import ActionBar, { ActionError } from "../../components/admin/ActionBar";
import StatusChip from "../../components/admin/StatusChip";
import ItemStatusBadge from "../../components/ItemStatusBadge";
import Icon from "../../components/Icon";
import { Spinner, ErrorState } from "../../components/StateMessages";
import { CATEGORIES, categoryLabel } from "../../constants/categories";
import { getItem, editItem, itemAction, deleteItem } from "../../services/adminApi";
import { isPublic } from "../../services/itemsApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n, errorText } from "../../lib/i18n";
import { formatDate } from "../../utils";
import { useAction, formatDateTime } from "./hooks";

const field =
  "mt-1 w-full rounded-xl border border-ink/15 bg-surface px-3 py-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20";

/** Edit form: only the content of the publication (moderation and lifecycle have their own buttons). */
function EditForm({ item, busy, onSave, onCancel }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    title: item.title,
    description: item.description,
    type: item.type,
    category: item.category,
    location: item.location,
    event_date: item.eventDate ?? "",
  });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...form, event_date: form.event_date || null });
      }}
      className="space-y-4"
    >
      <label className="block text-sm font-semibold text-ink">
        {t("admin.items.fields.title")}
        <input required maxLength={120} value={form.title} onChange={set("title")} className={field} dir="auto" />
      </label>
      <label className="block text-sm font-semibold text-ink">
        {t("admin.items.fields.description")}
        <textarea rows={4} maxLength={2000} value={form.description} onChange={set("description")} className={`${field} resize-y`} dir="auto" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-ink">
          {t("admin.items.fields.type")}
          <select value={form.type} onChange={set("type")} className={field}>
            <option value="lost">{t("types.lost")}</option>
            <option value="found">{t("types.found")}</option>
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          {t("admin.items.fields.category")}
          <select value={form.category} onChange={set("category")} className={field}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{categoryLabel(t, c.slug)}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          {t("admin.items.fields.location")}
          <input maxLength={120} value={form.location} onChange={set("location")} className={field} dir="auto" />
        </label>
        <label className="block text-sm font-semibold text-ink">
          {t("admin.items.fields.date")}
          <input type="date" value={form.event_date} onChange={set("event_date")} className={field} />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className="btn btn-ghost">{t("admin.actions.cancel")}</button>
        <button type="submit" disabled={busy} className="btn btn-dark">{t("admin.actions.save")}</button>
      </div>
    </form>
  );
}

/**
 * Details of one publication + every admin action on it.
 * Props: id, onClose, onChanged (list + counters must reload)
 */
export default function ItemDrawer({ id, onClose, onChanged }) {
  const { t, dateLocale } = useI18n();
  const [editing, setEditing] = useState(false);
  const { data: item, loading, error, retry } = useAsync((signal) => getItem(id, { signal }), [id]);
  useEffect(() => setEditing(false), [id]);

  const action = useAction(() => {
    retry();
    onChanged();
  });

  const run = (key, note) => {
    if (key === "edit") return setEditing(true);
    if (key === "delete") {
      return action
        .run(async () => {
          await deleteItem(id, note);
          return true;
        })
        .then((deleted) => deleted && onClose());
    }
    return action.run(() => itemAction(id, key, note));
  };

  const save = (changes) => action.run(() => editItem(id, changes)).then((result) => result && setEditing(false));

  const open = item?.lifecycleStatus === "open";

  return (
    <Drawer
      open
      onClose={onClose}
      title={item?.title ?? t("states.loading")}
      subtitle={
        item && (
          <span className="flex flex-wrap items-center gap-2">
            <ItemStatusBadge type={item.type} />
            <StatusChip status={item.moderationStatus} />
            <StatusChip status={item.lifecycleStatus} />
          </span>
        )
      }
      footer={
        item &&
        !editing && (
          <ActionBar
            busy={action.busy}
            onAction={run}
            actions={[
              item.moderationStatus !== "approved" && { key: "approve", label: t("admin.actions.approve"), icon: "check", variant: "dark" },
              item.moderationStatus !== "rejected" && {
                key: "reject",
                label: t("admin.actions.reject"),
                icon: "close",
                confirm: { text: t("admin.items.confirmReject"), note: true },
              },
              open && { key: "resolve", label: t("admin.actions.resolve"), icon: "check", confirm: { text: t("admin.items.confirmResolve") } },
              open && { key: "archive", label: t("admin.actions.archive"), icon: "archive", confirm: { text: t("admin.items.confirmArchive") } },
              !open && { key: "reopen", label: t("admin.actions.reopen"), icon: "undo" },
              { key: "edit", label: t("admin.actions.edit"), icon: "edit" },
              {
                key: "delete",
                label: t("admin.actions.delete"),
                icon: "trash",
                danger: true,
                confirm: { text: t("admin.items.confirmDelete"), note: true, confirmLabel: t("admin.actions.confirmDelete") },
              },
            ]}
          />
        )
      }
    >
      <ActionError error={action.error} onClose={action.clearError} />
      {loading && !item && <Spinner />}
      {error && <ErrorState message={errorText(t, error)} onRetry={retry} />}

      {item && editing && <EditForm item={item} busy={action.busy} onSave={save} onCancel={() => setEditing(false)} />}

      {item && !editing && (
        <>
          {item.images.length > 0 && (
            <div className="mb-6 grid grid-cols-3 gap-2">
              {item.images.map((src) => (
                <a key={src} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-ink/10 bg-paper-2">
                  <img src={src} alt="" className="aspect-[4/3] h-full w-full object-cover" />
                </a>
              ))}
            </div>
          )}

          <DrawerSection title={t("admin.items.details")}>
            <dl>
              <DetailRow label={t("admin.items.fields.category")}>{categoryLabel(t, item.category)}</DetailRow>
              <DetailRow label={t("admin.items.fields.location")}><span dir="auto">{item.location || "—"}</span></DetailRow>
              <DetailRow label={t(item.type === "lost" ? "details.dateLost" : "details.dateFound")}>{formatDate(item.eventDate, dateLocale)}</DetailRow>
              <DetailRow label={t("details.publishedOn")}>{formatDateTime(item.createdAt, dateLocale)}</DetailRow>
              {item.resolvedAt && <DetailRow label={t("admin.items.resolvedOn")}>{formatDateTime(item.resolvedAt, dateLocale)}</DetailRow>}
              {item.archivedAt && <DetailRow label={t("admin.items.archivedOn")}>{formatDateTime(item.archivedAt, dateLocale)}</DetailRow>}
            </dl>
          </DrawerSection>

          <DrawerSection title={t("details.description")}>
            <p className="whitespace-pre-line text-sm text-ink-2" dir="auto">{item.description || t("details.noDescription")}</p>
          </DrawerSection>

          <DrawerSection title={t("details.publisher")}>
            <dl>
              <DetailRow label={t("admin.users.fields.name")}>
                {item.publisherId ? (
                  <Link to={`/admin/users?open=${item.publisherId}`} className="font-semibold text-brand-ink hover:underline" dir="auto">
                    {item.publisher.name}
                  </Link>
                ) : (
                  item.publisher.name
                )}
              </DetailRow>
              <DetailRow label={t("admin.users.fields.email")}><span dir="ltr">{item.publisher.email}</span></DetailRow>
              <DetailRow label={t("admin.users.fields.phone")}><span dir="ltr">{item.publisher.phone || "—"}</span></DetailRow>
            </dl>
          </DrawerSection>

          <DrawerSection title={t("admin.items.claimsTitle", item.claims.length)}>
            {item.claims.length === 0 ? (
              <p className="text-sm text-muted">{t("admin.items.noClaims")}</p>
            ) : (
              <ul className="divide-y divide-ink/[0.07] rounded-xl border border-ink/10">
                {item.claims.map((claim) => (
                  <li key={claim.id}>
                    <Link to={`/admin/claims?open=${claim.id}`} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-ink/[0.03]">
                      <span className="min-w-0 flex-1 truncate font-medium text-ink" dir="auto">{claim.claimant?.full_name ?? "—"}</span>
                      <span className="text-xs text-muted">{formatDate(claim.created_at, dateLocale)}</span>
                      <StatusChip status={claim.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DrawerSection>

          {isPublic(item) && item.lifecycleStatus === "open" && (
            <Link to={`/items/${item.id}`} target="_blank" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline">
              <Icon name="external" className="h-4 w-4" />
              {t("admin.items.viewPublic")}
            </Link>
          )}
        </>
      )}
    </Drawer>
  );
}
