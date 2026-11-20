import { Link } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import StatCard from "../../components/admin/StatCard";
import StatusChip from "../../components/admin/StatusChip";
import ChartCard from "../../components/admin/charts/ChartCard";
import LineChart from "../../components/admin/charts/LineChart";
import ItemStatusBadge from "../../components/ItemStatusBadge";
import { ErrorState, Spinner } from "../../components/StateMessages";
import { getStats, listItems, listLogs } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n, errorText } from "../../lib/i18n";
import { formatDate } from "../../utils";
import { useAdmin } from "./AdminLayout";
import { formatDateTime, formatWeek } from "./hooks";

const WEEKS = 12;

/** Lost vs found per week, used here and on the Reports page */
export function WeeklyReportsChart({ weekly, busy, subtitle }) {
  const { t, dateLocale } = useI18n();
  const labels = weekly.map((w) => formatWeek(w.week, dateLocale));
  const series = [
    { key: "lost", label: t("types.lost"), color: "var(--viz-lost)", values: weekly.map((w) => w.lost) },
    { key: "found", label: t("types.found"), color: "var(--viz-found)", values: weekly.map((w) => w.found) },
  ];
  return (
    <ChartCard
      title={t("admin.charts.weeklyTitle")}
      subtitle={subtitle}
      busy={busy}
      legend={series.map((s) => ({ label: s.label, color: s.color, shape: "line" }))}
      table={{
        columns: [t("admin.charts.week"), t("types.lost"), t("types.found")],
        rows: weekly.map((w, i) => [labels[i], w.lost, w.found]),
      }}
    >
      <LineChart labels={labels} series={series} ariaLabel={t("admin.charts.weeklyTitle")} />
    </ChartCard>
  );
}

function PendingList() {
  const { t, dateLocale } = useI18n();
  const { data, loading, error, retry } = useAsync((signal) => listItems({ status: "pending", page_size: 5 }, { signal }), []);

  return (
    <section className="rounded-2xl border border-ink/10 bg-surface p-5">
      <h2 className="font-bold text-ink">{t("admin.overview.pendingTitle")}</h2>
      {loading && !data && <p className="mt-4 text-sm text-muted">{t("states.loading")}</p>}
      {error && <ErrorState message={errorText(t, error)} onRetry={retry} />}
      {data?.rows.length === 0 && <p className="mt-4 text-sm text-muted">{t("admin.overview.pendingEmpty")}</p>}
      <ul className="mt-3 divide-y divide-ink/[0.07]">
        {data?.rows.map((item) => (
          <li key={item.id}>
            <Link to={`/admin/${item.type}?open=${item.id}`} className="flex items-center gap-3 py-2.5 hover:text-brand-ink">
              <ItemStatusBadge type={item.type} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink" dir="auto">{item.title}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted">{formatDate(item.createdAt, dateLocale)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentActivity() {
  const { t, dateLocale } = useI18n();
  const { data, loading, error, retry } = useAsync((signal) => listLogs({ page_size: 6 }, { signal }), []);

  return (
    <section className="rounded-2xl border border-ink/10 bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-ink">{t("admin.overview.activityTitle")}</h2>
        <Link to="/admin/logs" className="text-xs font-semibold text-brand-ink hover:underline">{t("admin.overview.viewAll")}</Link>
      </div>
      {loading && !data && <p className="mt-4 text-sm text-muted">{t("states.loading")}</p>}
      {error && <ErrorState message={errorText(t, error)} onRetry={retry} />}
      {data?.rows.length === 0 && <p className="mt-4 text-sm text-muted">{t("admin.logs.emptyText")}</p>}
      <ul className="mt-3 space-y-3">
        {data?.rows.map((log) => (
          <li key={log.id} className="text-sm">
            <p className="text-ink">
              <strong className="font-semibold">{log.admin?.full_name ?? t("admin.logs.unknownAdmin")}</strong>{" "}
              <span className="text-ink-2">{t(`admin.logs.actions.${log.action}`)}</span>{" "}
              <span className="font-medium" dir="auto">
                {log.action === "items.archive_old" ? `(${t("admin.logs.count", log.details?.count, log.details?.days)})` : log.target_label}
              </span>
            </p>
            <p className="text-xs text-muted">{formatDateTime(log.created_at, dateLocale)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function OverviewPage() {
  const { t } = useI18n();
  const { admin } = useAdmin();
  const { data: stats, loading, error, retry } = useAsync((signal) => getStats({ weeks: WEEKS, signal }), []);

  const totals = stats?.totals;
  const items = totals?.items;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={t("admin.nav.overview")} title={t("admin.hello", admin.full_name)} subtitle={t("admin.overview.subtitle")} />

      {error && <ErrorState message={errorText(t, error)} onRetry={retry} />}
      {loading && !stats && <Spinner />}

      {totals && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              accent
              icon="alert"
              label={t("admin.stats.pendingItems")}
              value={items.pending}
              hint={t("admin.stats.pendingSplit", items.pending_lost, items.pending_found)}
              to={`/admin/${items.pending_lost || !items.pending_found ? "lost" : "found"}?status=pending`}
            />
            <StatCard icon="inbox" label={t("admin.stats.pendingClaims")} value={totals.claims.pending} hint={t("admin.stats.ofTotal", totals.claims.total)} to="/admin/claims?status=pending" />
            <StatCard icon="users" label={t("admin.stats.users")} value={totals.users.total} hint={t("admin.stats.pendingRegistrations", totals.users.pending)} to="/admin/users" />
            <StatCard icon="search" label={t("admin.stats.lostItems")} value={items.lost} to="/admin/lost" />
            <StatCard icon="check" label={t("admin.stats.foundItems")} value={items.found} hint={t("admin.stats.resolved", items.resolved)} to="/admin/found" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <WeeklyReportsChart weekly={stats.period.weekly} busy={loading} subtitle={t("admin.charts.lastWeeks", WEEKS)} />
            <div className="grid content-start gap-6">
              <PendingList />
              {totals.users.pending > 0 && (
                <Link
                  to="/admin/users?status=pending"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-surface p-5 hover:border-ink/25"
                >
                  <span className="text-sm font-semibold text-ink">{t("admin.overview.registrations", totals.users.pending)}</span>
                  <StatusChip status="pending" />
                </Link>
              )}
            </div>
          </div>

          <RecentActivity />
        </>
      )}
    </div>
  );
}
