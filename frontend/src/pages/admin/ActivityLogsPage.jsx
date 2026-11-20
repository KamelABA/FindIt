import { Link } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import FilterBar, { SelectFilter } from "../../components/admin/FilterBar";
import SearchField from "../../components/admin/SearchField";
import DataTable from "../../components/admin/DataTable";
import Pagination from "../../components/admin/Pagination";
import { listLogs, listUsers } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n } from "../../lib/i18n";
import { formatDateTime, useListParams } from "./hooks";

const FILTERS = ["q", "action", "admin"];

// Filter choices: a whole group, or one precise action
const ACTION_FILTERS = [
  "item",
  "item.approve",
  "item.reject",
  "item.edit",
  "item.resolve",
  "item.archive",
  "item.reopen",
  "item.delete",
  "items.archive_old",
  "claim",
  "claim.approve",
  "claim.reject",
  "claim.complete",
  "claim.reopen",
  "user",
  "user.approve",
  "user.reject",
  "user.suspend",
  "user.unsuspend",
];

const TARGET_PATH = { item: null, claim: "/admin/claims", user: "/admin/users" };

/** Extra information saved with the action (reason, edited fields, counts) */
function Details({ log }) {
  const { t } = useI18n();
  const d = log.details ?? {};
  const parts = [];
  if (d.note) parts.push(`“${d.note}”`);
  if (d.fields?.length) parts.push(t("admin.logs.fields", d.fields.map((f) => t(`admin.logs.fieldNames.${f}`)).join(", ")));
  if (d.count !== undefined) parts.push(t("admin.logs.count", d.count, d.days));
  if (d.claimant) parts.push(t("admin.logs.claimant", d.claimant));
  return parts.length ? <span className="line-clamp-2 text-ink-2" dir="auto">{parts.join(" · ")}</span> : <span className="text-muted">—</span>;
}

export default function ActivityLogsPage() {
  const { t, dateLocale } = useI18n();
  const [list, setParam, clearFilters, filtered] = useListParams(FILTERS);

  const { data, loading, error, retry } = useAsync(
    (signal) => listLogs({ q: list.q, action: list.action, admin_id: list.admin, page: list.page }, { signal }),
    [list.q, list.action, list.admin, list.page]
  );
  const { data: admins } = useAsync((signal) => listUsers({ role: "admin", page_size: 100 }, { signal }), []);

  const actionOptions = [
    { value: "", label: t("admin.logs.allActions") },
    ...ACTION_FILTERS.map((value) => ({
      value,
      label: value.includes(".") ? `· ${t(`admin.logs.actionNames.${value}`)}` : t(`admin.logs.groups.${value}`),
    })),
  ];
  const adminOptions = [
    { value: "", label: t("admin.logs.allAdmins") },
    ...(admins?.rows ?? []).map((a) => ({ value: a.id, label: a.full_name })),
  ];

  const columns = [
    {
      key: "date",
      header: t("admin.logs.columns.date"),
      render: (log) => <span className="whitespace-nowrap tabular-nums text-ink-2">{formatDateTime(log.created_at, dateLocale)}</span>,
    },
    {
      key: "admin",
      header: t("admin.logs.columns.admin"),
      hideBelow: "md",
      render: (log) => <span className="font-medium text-ink" dir="auto">{log.admin?.full_name ?? t("admin.logs.unknownAdmin")}</span>,
    },
    {
      key: "action",
      header: t("admin.logs.columns.action"),
      render: (log) => (
        <span className="inline-flex whitespace-nowrap rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-xs font-semibold text-ink">
          {t(`admin.logs.actionNames.${log.action}`)}
        </span>
      ),
    },
    {
      key: "target",
      header: t("admin.logs.columns.target"),
      render: (log) => {
        const base = TARGET_PATH[log.target_type];
        const label = log.action === "items.archive_old" ? t("admin.logs.manyItems") : log.target_label || "—";
        return (
          <span className="block min-w-40">
            <span className="block text-xs text-muted">{t(`admin.logs.targets.${log.target_type}`)}</span>
            {base && log.target_id ? (
              <Link to={`${base}?open=${log.target_id}`} className="font-medium text-ink hover:text-brand-ink hover:underline" dir="auto">{label}</Link>
            ) : (
              <span className="font-medium text-ink" dir="auto">{label}</span>
            )}
          </span>
        );
      },
    },
    { key: "details", header: t("admin.logs.columns.details"), hideBelow: "lg", render: (log) => <Details log={log} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("admin.eyebrow")} title={t("admin.nav.logs")} subtitle={t("admin.logs.subtitle")} />

      <FilterBar onClear={filtered ? clearFilters : undefined}>
        <SearchField value={list.q} onChange={(q) => setParam("q", q)} placeholder={t("admin.logs.search")} />
        <SelectFilter label={t("admin.logs.columns.action")} value={list.action} onChange={(v) => setParam("action", v)} options={actionOptions} />
        <SelectFilter label={t("admin.logs.columns.admin")} value={list.admin} onChange={(v) => setParam("admin", v)} options={adminOptions} />
      </FilterBar>

      <div>
        <DataTable
          caption={t("admin.nav.logs")}
          columns={columns}
          rows={data?.rows ?? null}
          loading={loading}
          error={error}
          onRetry={retry}
          empty={{ title: t("admin.logs.emptyTitle"), text: t("admin.logs.emptyText") }}
        />
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={(p) => setParam("page", p)} />}
      </div>
    </div>
  );
}
