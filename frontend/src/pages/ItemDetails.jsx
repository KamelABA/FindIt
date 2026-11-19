import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import ImageGallery from "../components/ImageGallery";
import ItemStatusBadge from "../components/ItemStatusBadge";
import SplitReveal from "../components/SplitReveal";
import StaggerIn from "../components/StaggerIn";
import Icon from "../components/Icon";
import { Spinner, ErrorState } from "../components/StateMessages";
import { getCategory, categoryLabel } from "../constants/categories";
import { getItemById } from "../services/itemsApi";
import { useAsync } from "../hooks/useAsync";
import { AUTH_ENABLED } from "../config/env";
import { formatDate, timeAgo } from "../utils";
import { useI18n, errorText } from "../lib/i18n";

function InfoRow({ icon, label, value, numeric = false }) {
  return (
    <div className="flex items-center gap-4 py-3.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper-2 text-ink-2">
        <Icon name={icon} />
      </span>
      <div className="min-w-0">
        <dt className="eyebrow text-muted">{label}</dt>
        <dd dir="auto" className={`truncate font-semibold text-ink ${numeric ? "text-sm tabular-nums" : ""}`}>
          {value || "—"}
        </dd>
      </div>
    </div>
  );
}

function ContactPublisher({ publisher, itemTitle }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const hasContact = publisher.email || publisher.phone;

  if (!hasContact) return null;

  if (!open) {
    return (
      <button type="button" data-magnetic onClick={() => setOpen(true)} className="btn btn-dark w-full">
        <Icon name="mail" className="h-4 w-4" />
        {t("details.contact")}
      </button>
    );
  }

  const row = "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink transition hover:bg-paper-2";

  return (
    <div className="rounded-2xl border border-ink/10 bg-surface p-4">
      <p className="eyebrow text-muted">{t("details.publisher")}</p>
      <p dir="auto" className="mt-1 font-semibold text-ink">{publisher.name}</p>
      <div className="-mx-1 mt-2">
        {publisher.email && (
          <a className={row} href={`mailto:${publisher.email}?subject=${encodeURIComponent(`FindIt – ${itemTitle}`)}`}>
            <Icon name="mail" className="h-4 w-4 text-muted" />
            <span dir="ltr" className="truncate">{publisher.email}</span>
          </a>
        )}
        {publisher.phone && (
          <a className={row} href={`tel:${publisher.phone.replace(/\s/g, "")}`}>
            <Icon name="phone" className="h-4 w-4 text-muted" />
            <span dir="ltr" className="tabular-nums">{publisher.phone}</span>
          </a>
        )}
      </div>
      <p className="mt-3 flex gap-2 border-t border-ink/10 pt-3 text-xs leading-relaxed text-muted">
        <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-found" />
        {t("details.tip")}
      </p>
    </div>
  );
}

export default function ItemDetails() {
  const { id } = useParams();
  const { t, lang, dateLocale } = useI18n();
  const { data: item, loading, error, retry } = useAsync((signal) => getItemById(id, { signal, lang }), [id, lang]);

  if (loading) return <Spinner label={t("details.loading")} />;

  if (error) {
    return (
      <div className="container-page py-20">
        <ErrorState
          message={error.status === 404 ? t("details.notFound") : errorText(t, error)}
          onRetry={error.status === 404 ? undefined : retry}
        />
        <div className="mt-6 text-center">
          <Link to="/items" className="btn btn-ghost">
            <Icon name="chevron-left" className="h-4 w-4 rtl:-scale-x-100" />
            {t("details.back")}
          </Link>
        </div>
      </div>
    );
  }

  const category = getCategory(item.category);
  const dateLabel = item.type === "found" ? t("details.dateFound") : t("details.dateLost");

  return (
    <div className="container-page pb-24 pt-10">
      {/* Breadcrumb */}
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-xs font-medium text-muted" aria-label={t("details.breadcrumb")}>
        <Link to="/" className="hover:text-ink">{t("details.crumbHome")}</Link>
        <span aria-hidden="true">/</span>
        <Link to="/items" className="hover:text-ink">{t("details.crumbItems")}</Link>
        <span aria-hidden="true">/</span>
        <span dir="auto" className="max-w-[60vw] truncate text-ink" aria-current="page">{item.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-24">
            <ImageGallery images={item.images} alt={item.title} fallbackIcon={category.icon} />
          </div>
        </div>

        {/* the four blocks rise in turn; inside, the title is revealed word by word and the facts slide in */}
        <StaggerIn variant="rise" each={0.06} className="space-y-8 lg:col-span-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <ItemStatusBadge type={item.type} size="md" />
              <span className="text-xs font-medium text-muted">
                {t("details.published")} {timeAgo(item.createdAt, dateLocale)}
              </span>
            </div>
            <SplitReveal as="h1" dir="auto" scroll={false} delay={0.05} className="display mt-4 text-3xl text-ink sm:text-4xl">
              {item.title}
            </SplitReveal>
          </div>

          <StaggerIn as="dl" variant="side" each={0.05} className="divide-y divide-ink/10 border-y border-ink/10">
            <InfoRow icon={category.icon} label={t("details.category")} value={categoryLabel(t, item.category)} />
            <InfoRow icon="pin" label={t("details.location")} value={item.location} />
            <InfoRow icon="calendar" label={dateLabel} value={formatDate(item.eventDate, dateLocale)} numeric />
            <InfoRow icon="clock" label={t("details.publishedOn")} value={formatDate(item.createdAt, dateLocale)} numeric />
          </StaggerIn>

          <div>
            <h2 className="eyebrow mb-3 text-muted">{t("details.description")}</h2>
            <p dir="auto" className="whitespace-pre-line text-[17px] leading-relaxed text-ink">
              {item.description || t("details.noDescription")}
            </p>
          </div>

          <div className="space-y-3">
            <ContactPublisher publisher={item.publisher} itemTitle={item.title} />

            {AUTH_ENABLED && item.type === "found" && (
              <div className="rounded-2xl border border-brand-500/40 bg-brand-100/50 p-4">
                {/* Claim flow page belongs to the claims part (Kamel); we only link to it */}
                <Link to={`/items/${item.id}/claim`} data-magnetic className="btn btn-primary w-full">
                  {t("details.claim")}
                </Link>
                <p className="mt-2 text-center text-xs text-muted">{t("details.claimNote")}</p>
              </div>
            )}
          </div>
        </StaggerIn>
      </div>
    </div>
  );
}
