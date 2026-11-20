import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import StatCard from "../../components/admin/StatCard";
import FilterBar from "../../components/admin/FilterBar";
import ChartCard from "../../components/admin/charts/ChartCard";
import ColumnChart from "../../components/admin/charts/ColumnChart";
import StackedBars from "../../components/admin/charts/StackedBars";
import SegmentedBar from "../../components/admin/charts/SegmentedBar";
import SegmentedControl from "../../components/SegmentedControl";
import Icon from "../../components/Icon";
import { ErrorState, Spinner } from "../../components/StateMessages";
import { categoryLabel } from "../../constants/categories";
import { getStats } from "../../services/adminApi";
import { useAsync } from "../../hooks/useAsync";
import { useI18n, errorText } from "../../lib/i18n";
import { formatDate } from "../../utils";
import { formatWeek } from "./hooks";
import { WeeklyReportsChart } from "./OverviewPage";

const RANGES = [4, 12, 26, 52]; // weeks
const SLOTS = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)"];
const SLOT_INK = ["#fff", "#fff", "#fff", "var(--viz-ink-4)"];

/** Parts of a whole in the fixed slot order (colour follows the position, never the size) */
const partsOf = (t, keys, counts) =>
  keys.map((key, i) => ({ key, label: t(`admin.status.${key}`), value: counts[key] ?? 0, color: SLOTS[i], ink: SLOT_INK[i] }));

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { t, dateLocale } = useI18n();
  const [params, setParams] = useSearchParams();
  const weeks = RANGES.includes(Number(params.get("weeks"))) ? Number(params.get("weeks")) : 12;

  const { data: stats, loading, error, retry } = useAsync((signal) => getStats({ weeks, signal }), [weeks]);
  const rangeOptions = useMemo(() => RANGES.map((w) => ({ value: String(w), label: t(`admin.reports.range.${w}`) })), [t]);

  const period = stats?.period;
  const weekLabels = period?.weekly.map((w) => formatWeek(w.week, dateLocale)) ?? [];
  const resolvedShare = period?.items.total ? Math.round((period.items.resolved / period.items.total) * 100) : 0;

  const exportCsv = () => {
    const rows = [
      [t("admin.charts.week"), t("types.lost"), t("types.found"), t("admin.reports.recovered")],
      ...period.weekly.map((w) => [w.week, w.lost, w.found, w.recovered]),
      [],
      [t("admin.items.fields.category"), t("types.lost"), t("types.found")],
      ...period.by_category.map((c) => [categoryLabel(t, c.category), c.lost, c.found]),
    ];
    downloadCsv(`findit-report-${weeks}w-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.nav.reports")}
        subtitle={t("admin.reports.subtitle")}
        actions={
          period && (
            <button type="button" onClick={exportCsv} className="btn btn-ghost min-h-9! gap-1.5! px-3.5! py-1.5! text-[13px]!">
              <Icon name="download" className="h-4 w-4" />
              {t("admin.reports.export")}
            </button>
          )
        }
      />

      {/* one filter row: it scopes every number below */}
      <FilterBar>
        <SegmentedControl label={t("admin.reports.rangeLabel")} options={rangeOptions} value={String(weeks)} onChange={(v) => setParams({ weeks: v }, { replace: true })} className="self-start" />
        {stats && <p className="text-sm text-muted">{t("admin.reports.since", formatDate(stats.since, dateLocale))}</p>}
      </FilterBar>

      {error && <ErrorState message={errorText(t, error)} onRetry={retry} />}
      {loading && !stats && <Spinner />}

      {period && (
        <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
            {/* the one hero figure of the page */}
            <section className="rounded-2xl border border-ink/10 bg-surface p-6">
              <p className="text-sm font-semibold text-ink-2">{t("admin.reports.recovered")}</p>
              <p className="mt-2 text-6xl font-bold tracking-tight text-ink">{period.recovered.toLocaleString("en")}</p>
              <p className="mt-2 text-sm text-muted">{t("admin.reports.resolvedShare", resolvedShare)}</p>
            </section>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label={t("admin.reports.newReports")} value={period.items.total} />
              <StatCard label={t("admin.stats.lostItems")} value={period.items.lost} />
              <StatCard label={t("admin.stats.foundItems")} value={period.items.found} />
              <StatCard label={t("admin.reports.newClaims")} value={period.claims.total} hint={t("admin.reports.newUsers", period.users.total)} />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <WeeklyReportsChart weekly={period.weekly} busy={loading} subtitle={t("admin.charts.lastWeeks", weeks)} />
            <ChartCard
              title={t("admin.reports.recoveredWeekly")}
              subtitle={t("admin.reports.recoveredWeeklyHint")}
              busy={loading}
              table={{
                columns: [t("admin.charts.week"), t("admin.reports.recovered")],
                rows: period.weekly.map((w, i) => [weekLabels[i], w.recovered]),
              }}
            >
              <ColumnChart
                labels={weekLabels}
                values={period.weekly.map((w) => w.recovered)}
                label={t("admin.reports.recovered")}
                color="var(--viz-1)"
                ariaLabel={t("admin.reports.recoveredWeekly")}
              />
            </ChartCard>
          </div>

          <ChartCard
            title={t("admin.reports.byCategory")}
            subtitle={t("admin.charts.lastWeeks", weeks)}
            busy={loading}
            legend={[
              { label: t("types.lost"), color: "var(--viz-lost)", shape: "rect" },
              { label: t("types.found"), color: "var(--viz-found)", shape: "rect" },
            ]}
            table={{
              columns: [t("admin.items.fields.category"), t("types.lost"), t("types.found")],
              rows: period.by_category.map((c) => [categoryLabel(t, c.category), c.lost, c.found]),
            }}
          >
            <StackedBars
              rows={period.by_category.map((c) => ({ key: c.category, label: categoryLabel(t, c.category), values: { lost: c.lost, found: c.found } }))}
              series={[
                { key: "lost", label: t("types.lost"), color: "var(--viz-lost)" },
                { key: "found", label: t("types.found"), color: "var(--viz-found)" },
              ]}
            />
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title={t("admin.reports.moderation")} subtitle={t("admin.reports.ofReports", period.items.total)} busy={loading}>
              <SegmentedBar label={t("admin.reports.moderation")} parts={partsOf(t, ["pending", "approved", "rejected"], period.items)} />
            </ChartCard>
            <ChartCard title={t("admin.reports.lifecycle")} subtitle={t("admin.reports.ofReports", period.items.total)} busy={loading}>
              <SegmentedBar label={t("admin.reports.lifecycle")} parts={partsOf(t, ["open", "resolved", "archived"], period.items)} />
            </ChartCard>
            <ChartCard title={t("admin.reports.claims")} subtitle={t("admin.reports.ofClaims", period.claims.total)} busy={loading}>
              <SegmentedBar label={t("admin.reports.claims")} parts={partsOf(t, ["pending", "approved", "rejected", "completed"], period.claims)} />
            </ChartCard>
            <ChartCard title={t("admin.reports.registrations")} subtitle={t("admin.reports.ofUsers", period.users.total)} busy={loading}>
              <SegmentedBar label={t("admin.reports.registrations")} parts={partsOf(t, ["pending", "approved", "rejected"], period.users)} />
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
