import { useMemo, useState } from "react";
import PageHeader from "../../components/admin/PageHeader";
import FilterBar, { SelectFilter } from "../../components/admin/FilterBar";
import SearchField from "../../components/admin/SearchField";
import DataTable from "../../components/admin/DataTable";
import Pagination from "../../components/admin/Pagination";
import StatusChip from "../../components/admin/StatusChip";
import ActionBar, { ActionError } from "../../components/admin/ActionBar";
import SegmentedControl from "../../components/SegmentedControl";
import Icon from "../../components/Icon";
import { CATEGORIES, categoryLabel, getCategory } from "../../constants/categories";
import { listItems, itemAction, archiveOldItems, getSettings } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n } from "../../lib/i18n";
import { formatDate } from "../../utils";
import { useAdmin } from "./AdminLayout";
import { useAction, useListParams } from "./hooks";
import ItemDrawer from "./ItemDrawer";

const FILTERS = ["q", "status", "lifecycle", "category"];

/** Lost items or found items management (same page, `type` = "lost" | "found"). */
export default function ItemsPage({ type }) {
  const { t, dateLocale } = useI18n();
  const { refreshCounts } = useAdmin();
  const [list, setParam, clearFilters, filtered] = useListParams(FILTERS);
  const [notice, setNotice] = useState("");

  const { data, loading, error, retry } = useAsync(
    (signal) =>
      listItems(
        { type, q: list.q, status: list.status, lifecycle: list.lifecycle, category: list.category, page: list.page },
        { signal }
      ),
    [type, list.q, list.status, list.lifecycle, list.category, list.page]
  );

  // the archive delay is a system setting (changed by super admins)
  const { data: settings } = useAsync((signal) => getSettings({ signal }), []);

  const changed = () => {
    retry();
    refreshCounts();
  };
  const action = useAction(changed);

  const statusOptions = useMemo(
    () => ["", "pending", "approved", "rejected"].map((value) => ({ value, label: t(`admin.status.${value || "all"}`) })),
    [t]
  );
  const lifecycleOptions = ["", "open", "resolved", "archived"].map((value) => ({ value, label: t(`admin.status.${value || "all"}`) }));
  const categoryOptions = [{ value: "", label: t("browse.allCategories") }, ...CATEGORIES.map((c) => ({ value: c.slug, label: categoryLabel(t, c.slug) }))];

  const archiveOld = () =>
    action.run(() => archiveOldItems()).then((result) => {
      if (result) setNotice(t("admin.items.archivedNotice", result.archived));
    });

  const columns = [
    {
      key: "item",
      header: t("admin.items.columns.item"),
      render: (item) => (
        <div className="flex min-w-56 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper-2 text-ink/30">
            {item.images[0] ? (
              <img src={item.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <Icon name={getCategory(item.category).icon} className="h-5 w-5" />
            )}
          </span>
          <span className="min-w-0">
            <span className="line-clamp-1 font-semibold text-ink" dir="auto">{item.title}</span>
            <span className="line-clamp-1 text-xs text-muted" dir="auto">{item.location || "—"}</span>
          </span>
        </div>
      ),
    },
    { key: "category", header: t("admin.items.fields.category"), hideBelow: "lg", render: (item) => <span className="text-ink-2">{categoryLabel(t, item.category)}</span> },
    {
      key: "publisher",
      header: t("details.publisher"),
      hideBelow: "xl",
      render: (item) => <span className="text-ink-2" dir="auto">{item.publisher.name}</span>,
    },
    {
      key: "date",
      header: t("admin.items.columns.published"),
      hideBelow: "md",
      render: (item) => <span className="whitespace-nowrap tabular-nums text-muted">{formatDate(item.createdAt, dateLocale)}</span>,
    },
    {
      key: "status",
      header: t("admin.items.columns.status"),
      render: (item) => (
        <span className="flex flex-wrap gap-1.5">
          <StatusChip status={item.moderationStatus} />
          {item.lifecycleStatus !== "open" && <StatusChip status={item.lifecycleStatus} />}
        </span>
      ),
    },
    {
      key: "quick",
      header: <span className="sr-only">{t("admin.items.columns.actions")}</span>,
      className: "text-end",
      render: (item) =>
        item.moderationStatus === "pending" ? (
          <span className="inline-flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              disabled={action.busy}
              onClick={() => action.run(() => itemAction(item.id, "approve"))}
              className="btn-icon h-8! w-8! bg-found/15 text-found hover:bg-found/25"
              aria-label={`${t("admin.actions.approve")}: ${item.title}`}
              title={t("admin.actions.approve")}
            >
              <Icon name="check" className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={action.busy}
              onClick={() => setParam("open", item.id)}
              className="btn-icon h-8! w-8! bg-lost/10 text-lost hover:bg-lost/20"
              aria-label={`${t("admin.actions.reject")}: ${item.title}`}
              title={t("admin.actions.reject")}
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </span>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("admin.nav.items")}
        title={t(`admin.nav.${type}`)}
        subtitle={t(`admin.items.subtitle.${type}`)}
        actions={
          <ActionBar
            busy={action.busy}
            onAction={archiveOld}
            actions={[
              {
                key: "archive-old",
                label: t("admin.items.archiveOld"),
                icon: "archive",
                confirm: { text: t("admin.items.confirmArchiveOld", settings?.values.archive_after_days ?? "…") },
              },
            ]}
          />
        }
      />

      {notice && (
        <p role="status" className="flex items-center justify-between gap-3 rounded-xl bg-found/10 px-4 py-3 text-sm text-ink">
          {notice}
          <button type="button" onClick={() => setNotice("")} className="font-semibold text-muted hover:text-ink">{t("admin.actions.dismiss")}</button>
        </p>
      )}
      <ActionError error={action.error} onClose={action.clearError} />

      <FilterBar onClear={filtered ? clearFilters : undefined}>
        <SearchField value={list.q} onChange={(q) => setParam("q", q)} placeholder={t("admin.items.search")} />
        <SegmentedControl label={t("admin.filters.moderation")} options={statusOptions} value={list.status} onChange={(v) => setParam("status", v)} className="self-start" />
        <SelectFilter label={t("admin.filters.lifecycle")} value={list.lifecycle} onChange={(v) => setParam("lifecycle", v)} options={lifecycleOptions} />
        <SelectFilter label={t("admin.items.fields.category")} value={list.category} onChange={(v) => setParam("category", v)} options={categoryOptions} />
      </FilterBar>

      <div>
        <DataTable
          caption={t(`admin.nav.${type}`)}
          columns={columns}
          rows={data?.rows ?? null}
          loading={loading}
          error={error}
          onRetry={retry}
          onRowClick={(item) => setParam("open", item.id)}
          rowLabel={(item) => t("admin.table.openRow", item.title)}
          empty={{ title: t("admin.items.emptyTitle"), text: t("admin.items.emptyText") }}
        />
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={(p) => setParam("page", p)} />}
      </div>

      {list.open && <ItemDrawer id={list.open} onClose={() => setParam("open", "")} onChanged={changed} />}
    </div>
  );
}
