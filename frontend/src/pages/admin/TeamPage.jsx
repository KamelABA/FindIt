import { Link } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import DataTable from "../../components/admin/DataTable";
import Pagination from "../../components/admin/Pagination";
import StatusChip from "../../components/admin/StatusChip";
import Icon from "../../components/Icon";
import { listUsers } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n } from "../../lib/i18n";
import { formatDate } from "../../utils";
import { useAdmin } from "./AdminLayout";
import { useListParams } from "./hooks";
import UserDrawer from "./UserDrawer";

/**
 * Super admins: who runs FindIt (use case "Manage Admins, Roles").
 * Roles are changed in the account's drawer; new admins are promoted from approved students.
 */
export default function TeamPage() {
  const { t, dateLocale } = useI18n();
  const { admin, refreshCounts } = useAdmin();
  const [list, setParam] = useListParams([]);

  const { data, loading, error, retry } = useAsync(
    (signal) => listUsers({ role: "staff", page: list.page }, { signal }),
    [list.page]
  );
  const changed = () => {
    retry();
    refreshCounts();
  };

  const columns = [
    {
      key: "name",
      header: t("admin.users.fields.name"),
      render: (user) => (
        <span className="block min-w-44">
          <span className="block font-semibold text-ink" dir="auto">
            {user.full_name}
            {user.id === admin.id && <span className="ms-2 text-xs font-medium text-muted">({t("admin.team.you")})</span>}
          </span>
          <span className="block text-xs text-muted" dir="ltr">{user.email}</span>
        </span>
      ),
    },
    { key: "role", header: t("admin.users.fields.role"), render: (user) => <StatusChip status={user.role} /> },
    {
      key: "account",
      header: t("admin.users.fields.account"),
      hideBelow: "sm",
      render: (user) => <StatusChip status={user.is_suspended ? "suspended" : "active"} />,
    },
    {
      key: "joined",
      header: t("admin.users.fields.joined"),
      hideBelow: "md",
      render: (user) => <span className="whitespace-nowrap tabular-nums text-muted">{formatDate(user.created_at, dateLocale)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("admin.superOnly.badge")}
        title={t("admin.nav.team")}
        subtitle={t("admin.team.subtitle")}
        actions={
          <Link to="/admin/users?role=student&status=approved" className="btn btn-dark min-h-9! gap-1.5! px-3.5! py-1.5! text-[13px]!">
            <Icon name="users" className="h-4 w-4" />
            {t("admin.team.promote")}
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {["admin", "super_admin"].map((role) => (
          <div key={role} className="rounded-2xl border border-ink/10 bg-surface p-5">
            <StatusChip status={role} />
            <p className="mt-3 text-sm text-ink-2">{t(`admin.team.can.${role}`)}</p>
          </div>
        ))}
      </div>

      <div>
        <DataTable
          caption={t("admin.nav.team")}
          columns={columns}
          rows={data?.rows ?? null}
          loading={loading}
          error={error}
          onRetry={retry}
          onRowClick={(user) => setParam("open", user.id)}
          rowLabel={(user) => t("admin.table.openRow", user.full_name)}
          empty={{ title: t("admin.team.emptyTitle"), text: t("admin.team.emptyText") }}
        />
        {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={(p) => setParam("page", p)} />}
      </div>

      {list.open && <UserDrawer id={list.open} onClose={() => setParam("open", "")} onChanged={changed} />}
    </div>
  );
}
