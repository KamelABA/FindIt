import { useMemo } from "react";
import PageHeader from "../../components/admin/PageHeader";
import FilterBar, { SelectFilter } from "../../components/admin/FilterBar";
import SearchField from "../../components/admin/SearchField";
import DataTable from "../../components/admin/DataTable";
import Pagination from "../../components/admin/Pagination";
import StatusChip from "../../components/admin/StatusChip";
import SegmentedControl from "../../components/SegmentedControl";
import { listUsers } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n } from "../../lib/i18n";
import { formatDate } from "../../utils";
import { useAdmin } from "./AdminLayout";
import { useListParams } from "./hooks";
import UserDrawer from "./UserDrawer";

const FILTERS = ["q", "status", "suspended", "role"];

export default function UsersPage() {
  const { t, dateLocale } = useI18n();
  const { refreshCounts } = useAdmin();
  const [list, setParam, clearFilters, filtered] = useListParams(FILTERS);

  const { data, loading, error, retry } = useAsync(
    (signal) => listUsers({ q: list.q, status: list.status, suspended: list.suspended, role: list.role, page: list.page }, { signal }),
    [list.q, list.status, list.suspended, list.role, list.page]
  );
  const changed = () => {
    retry();
    refreshCounts();
  };

  const statusOptions = useMemo(
    () => ["", "pending", "approved", "rejected"].map((value) => ({ value, label: t(`admin.status.${value || "all"}`) })),
    [t]
  );
  const accountOptions = [
    { value: "", label: t("admin.status.all") },
    { value: "false", label: t("admin.status.active") },
    { value: "true", label: t("admin.status.suspended") },
  ];
  const roleOptions = [
    { value: "", label: t("admin.status.all") },
    { value: "student", label: t("admin.users.students") },
    { value: "admin", label: t("admin.users.admins") },
  ];

  const columns = [
    {
      key: "name",
      header: t("admin.users.fields.name"),
      render: (user) => (
        <span className="block min-w-44">
          <span className="flex items-center gap-2 font-semibold text-ink" dir="auto">
            {user.full_name}
            {user.is_admin && <StatusChip status="admin" />}
          </span>
          <span className="block text-xs text-muted" dir="ltr">{user.email}</span>
        </span>
      ),
    },
    {
      key: "student_number",
      header: t("admin.users.fields.studentNumber"),
      hideBelow: "md",
      render: (user) => <span className="tabular-nums text-ink-2" dir="ltr">{user.student_number || "—"}</span>,
    },
    { key: "faculty", header: t("admin.users.fields.faculty"), hideBelow: "xl", render: (user) => <span className="text-ink-2">{user.faculty || "—"}</span> },
    { key: "registration", header: t("admin.users.fields.registration"), render: (user) => <StatusChip status={user.registration_status} /> },
    {
      key: "account",
      header: t("admin.users.fields.account"),
      hideBelow: "sm",
      render: (user) => <StatusChip status={user.is_suspended ? "suspended" : "active"} />,
    },
    {
      key: "joined",
      header: t("admin.users.fields.joined"),
      hideBelow: "lg",
      render: (user) => <span className="whitespace-nowrap tabular-nums text-muted">{formatDate(user.created_at, dateLocale)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("admin.eyebrow")} title={t("admin.nav.users")} subtitle={t("admin.users.subtitle")} />

      <FilterBar onClear={filtered ? clearFilters : undefined}>
        <SearchField value={list.q} onChange={(q) => setParam("q", q)} placeholder={t("admin.users.search")} />
        <SegmentedControl label={t("admin.users.fields.registration")} options={statusOptions} value={list.status} onChange={(v) => setParam("status", v)} className="self-start" />
        <SelectFilter label={t("admin.users.fields.account")} value={list.suspended} onChange={(v) => setParam("suspended", v)} options={accountOptions} />
        <SelectFilter label={t("admin.users.fields.role")} value={list.role} onChange={(v) => setParam("role", v)} options={roleOptions} />
      </FilterBar>

      <div>
        <DataTable
          caption={t("admin.nav.users")}
          columns={columns}
          rows={data?.rows ?? null}
          loading={loading}
          error={error}
          onRetry={retry}
          onRowClick={(user) => setParam("open", user.id)}
          rowLabel={(user) => t("admin.table.openRow", user.full_name)}
          empty={{ title: t("admin.users.emptyTitle"), text: t("admin.users.emptyText") }}
        />
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={(p) => setParam("page", p)} />}
      </div>

      {list.open && <UserDrawer id={list.open} onClose={() => setParam("open", "")} onChanged={changed} />}
    </div>
  );
}
