import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import ItemCard, { ItemCardSkeleton } from "../components/ItemCard";
import SegmentedControl from "../components/SegmentedControl";
import SplitReveal from "../components/SplitReveal";
import CountUp from "../components/CountUp";
import { ErrorState, EmptyState } from "../components/StateMessages";
import { CATEGORIES, categoryLabel } from "../constants/categories";
import { getItems } from "../services/itemsApi";
import { useAsync } from "../hooks/useAsync";
import { gsap, Flip, useGSAP, motionOK, imagesReady } from "../lib/gsap";
import { useI18n, errorText } from "../lib/i18n";

const isHidden = (el) => Number(gsap.getProperty(el, "opacity")) < 0.05;

/**
 * Minimal Browse page so that Home search & category links work end-to-end.
 * The full Browse page (advanced filters, pagination) can replace this later.
 *
 * Motion (GSAP): switching type / category glides the pill, rebuilds the title letter by letter,
 * rolls the result count, and re-arranges the grid with Flip:
 *   1. on click, cards that can't match the new filter fade out at once (no waiting for the server)
 *   2. when the answer arrives, the cards that stay glide to their new place and new ones fade in
 */
export default function BrowseItems() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const type = params.get("type") || "";

  const typeOptions = useMemo(
    () => [
      { value: "", label: t("types.all") },
      { value: "lost", label: t("types.lost") },
      { value: "found", label: t("types.found") },
    ],
    [t]
  );
  const categoryOptions = useMemo(
    () => [
      { value: "", label: t("browse.allCategories") },
      ...CATEGORIES.map((c) => ({ value: c.slug, label: categoryLabel(t, c.slug), icon: c.icon })),
    ],
    [t]
  );

  const { data: items, loading, error, retry } = useAsync(
    (signal) => getItems({ q, category, type, limit: 50, signal, lang }),
    [q, category, type, lang]
  );

  // `shown` = the list currently drawn. It lags behind `items` so the old cards can animate out first.
  const [shown, setShown] = useState(null);
  const grid = useRef(null);
  const flipState = useRef(null);

  const cardOf = (id) => grid.current?.querySelector(`[data-flip-id="${CSS.escape(id)}"]`);

  useEffect(() => {
    if (loading || error || !items) return;
    const cards = grid.current ? gsap.utils.toArray("[data-flip-id]", grid.current) : [];
    if (!cards.length || !motionOK()) {
      setShown(items);
      return;
    }
    const nextIds = new Set(items.map((i) => i.id));
    const leaving = cards.filter((el) => !nextIds.has(el.dataset.flipId));
    const staying = cards.filter((el) => nextIds.has(el.dataset.flipId));
    if (staying.length) gsap.set(staying, { opacity: 1, scale: 1 });

    const swap = () => {
      flipState.current = Flip.getState(staying); // remember where the surviving cards are…
      setShown(items); // …then let React draw the new list
    };
    const stillVisible = leaving.filter((el) => !isHidden(el));
    if (!stillVisible.length) {
      swap(); // already faded out on click: go straight to the re-arrangement
      return;
    }
    const out = gsap.to(stillVisible, { opacity: 0, scale: 0.94, duration: 0.15, ease: "power2.out", overwrite: true, onComplete: swap });
    return () => out.kill();
  }, [items, loading, error]);

  // Runs right after React has drawn the new list
  useGSAP(
    (context, contextSafe) => {
      if (!grid.current || !motionOK()) return;
      const cards = gsap.utils.toArray("[data-flip-id]", grid.current);
      const state = flipState.current;
      flipState.current = null;

      if (!state) {
        // first load (or coming back from an empty result): everything rises in,
        // once the pictures are decoded so nothing loads mid-movement
        gsap.set(cards, { opacity: 0, y: 24 });
        const rise = contextSafe(() =>
          gsap.to(cards, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.03, clearProps: "transform,opacity" })
        );
        imagesReady(grid.current, 400).then(rise);
        return;
      }
      Flip.from(state, {
        targets: cards,
        duration: 0.45,
        ease: "power3.out",
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { opacity: 0, y: 18, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out", stagger: 0.03, delay: 0.05 }
          ),
      });
    },
    { dependencies: [shown], scope: grid }
  );

  const update = (key, value) => {
    // Instant feedback: fade out the cards we already know won't match the new type / category
    if (shown?.length && motionOK() && (key === "type" || key === "category")) {
      const nextType = key === "type" ? value : type;
      const nextCategory = key === "category" ? value : category;
      const out = shown
        .filter((i) => (nextType && i.type !== nextType) || (nextCategory && i.category !== nextCategory))
        .map((i) => cardOf(i.id))
        .filter(Boolean);
      if (out.length) gsap.to(out, { opacity: 0, scale: 0.94, duration: 0.18, ease: "power2.out", overwrite: true });
    }
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };

  const hasFilters = Boolean(q || category || type);
  const title = category ? categoryLabel(t, category) : t("browse.allItems");
  const firstLoad = shown === null;
  const count = shown?.length ?? 0;

  return (
    <div className="container-page pb-24 pt-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-8">
        <div>
          <p className="eyebrow mb-3 text-brand-ink">{t("browse.eyebrow")}</p>
          {/* key = title, so the letters are rebuilt every time the category changes */}
          <SplitReveal key={title} as="h1" by="chars" scroll={false} className="display text-4xl text-ink sm:text-5xl">
            {title}
          </SplitReveal>
        </div>
        <p className="text-sm font-medium tabular-nums text-muted" aria-live="polite">
          {firstLoad && loading ? (
            t("browse.loading")
          ) : error ? (
            ""
          ) : (
            <>
              <CountUp value={count} /> {t("browse.results", count)}
            </>
          )}
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBar key={q} size="sm" initialValue={q} onSearch={(term) => update("q", term)} className="lg:max-w-md" />
          <SegmentedControl
            label={t("browse.typeLabel")}
            options={typeOptions}
            value={type}
            onChange={(v) => update("type", v)}
            className="self-start"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => setParams({})}
              className="self-start rounded-full px-3 py-2 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline lg:ms-auto"
            >
              {t("browse.clear")}
            </button>
          )}
        </div>
        <SegmentedControl
          label={t("browse.categoryLabel")}
          options={categoryOptions}
          value={category}
          onChange={(v) => update("category", v)}
          className="self-start"
        />
      </div>

      <div className="mt-10">
        {/* skeletons on first load, and when coming back from an empty result */}
        {loading && !shown?.length && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ItemCardSkeleton key={i} />)}
          </div>
        )}
        {!loading && error && <ErrorState message={errorText(t, error)} onRetry={retry} />}
        {!error && shown?.length === 0 && !loading && <EmptyState title={t("browse.emptyTitle")}>{t("browse.emptyText")}</EmptyState>}
        {!error && shown?.length > 0 && (
          <div ref={grid} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy={loading}>
            {shown.map((item) => (
              // plain wrapper: GSAP moves this, the card inside keeps its own CSS hover transition
              <div key={item.id} data-flip-id={item.id} className="will-change-transform">
                <ItemCard item={item} className="h-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
