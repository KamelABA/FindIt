import { useMemo } from "react";
import PageHeader from "../../components/admin/PageHeader";
import FilterBar from "../../components/admin/FilterBar";
import SearchField from "../../components/admin/SearchField";
import DataTable from "../../components/admin/DataTable";
import Pagination from "../../components/admin/Pagination";
import StatusChip from "../../components/admin/StatusChip";
import SegmentedControl from "../../components/SegmentedControl";
import ItemStatusBadge from "../../components/ItemStatusBadge";
import Icon from "../../components/Icon";
import { listClaims } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n } from "../../lib/i18n";
import { formatDate } from "../../utils";
import { useAdmin } from "./AdminLayout";
import { useListParams } from "./hooks";
import ClaimDrawer from "./ClaimDrawer";

const FILTERS = ["q", "status"];

export default function ClaimsPage() {
  const { t, dateLocale } = useI18n();
  const { refreshCounts } = useAdmin();
  const [list, setParam, clearFilters, filtered] = useListParams(FILTERS);

  const { data, loading, error, retry } = useAsync(
    (signal) => listClaims({ q: list.q, status: list.status, page: list.page }, { signal }),
    [list.q, list.status, list.page]
  );
  const changed = () => {
    retry();
    refreshCounts();
  };

  const statusOptions = useMemo(
    () => ["", "pending", "approved", "rejected", "completed"].map((value) => ({ value, label: t(`admin.status.${value || "all"}`) })),
    [t]
  );

  const columns = [
    {
      key: "item",
      header: t("admin.claims.item"),
      render: (claim) => (
        <span className="flex min-w-52 items-center gap-2">
          {claim.item && <ItemStatusBadge type={claim.item.type} />}
          <span className="line-clamp-1 font-semibold text-ink" dir="auto">{claim.item?.title ?? t("admin.claims.deletedItem")}</span>
        </span>
      ),
    },
    {
      key: "claimant",
      header: t("admin.claims.claimant"),
      render: (claim) => (
        <span className="block min-w-36">
          <span className="block font-medium text-ink" dir="auto">{claim.claimant?.full_name ?? "—"}</span>
          <span className="block text-xs text-muted" dir="ltr">{claim.claimant?.email}</span>
        </span>
      ),
    },
    {
      key: "message",
      header: t("admin.claims.explanation"),
      hideBelow: "xl",
      render: (claim) => <span className="line-clamp-2 max-w-sm text-ink-2" dir="auto">{claim.message || "—"}</span>,
    },
    {
      key: "evidence",
      header: t("admin.claims.evidenceShort"),
      hideBelow: "lg",
      render: (claim) => (
        <span className="inline-flex items-center gap-1 tabular-nums text-muted">
          <Icon name="documents" className="h-4 w-4" />
          {claim.evidence_urls.length}
        </span>
      ),
    },
    {
      key: "date",
      header: t("admin.claims.submitted"),
      hideBelow: "md",
      render: (claim) => <span className="whitespace-nowrap tabular-nums text-muted">{formatDate(claim.created_at, dateLocale)}</span>,
    },
    { key: "status", header: t("admin.items.columns.status"), render: (claim) => <StatusChip status={claim.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("admin.eyebrow")} title={t("admin.nav.claims")} subtitle={t("admin.claims.subtitle")} />

      <FilterBar onClear={filtered ? clearFilters : undefined}>
        <SearchField value={list.q} onChange={(q) => setParam("q", q)} placeholder={t("admin.claims.search")} />
        <SegmentedControl label={t("admin.filters.status")} options={statusOptions} value={list.status} onChange={(v) => setParam("status", v)} className="self-start" />
      </FilterBar>

      <div>
        <DataTable
          caption={t("admin.nav.claims")}
          columns={columns}
          rows={data?.rows ?? null}
          loading={loading}
          error={error}
          onRetry={retry}
          onRowClick={(claim) => setParam("open", claim.id)}
          rowLabel={(claim) => t("admin.table.openRow", claim.item?.title ?? "")}
          empty={{ title: t("admin.claims.emptyTitle"), text: t("admin.claims.emptyText") }}
        />
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={(p) => setParam("page", p)} />}
      </div>

      {list.open && <ClaimDrawer id={list.open} onClose={() => setParam("open", "")} onChanged={changed} />}
    </div>
  );
}
