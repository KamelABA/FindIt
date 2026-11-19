import { useRef } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import CategoryCard from "../components/CategoryCard";
import ItemCard, { ItemCardSkeleton } from "../components/ItemCard";
import Logo from "../components/Logo";
import Icon from "../components/Icon";
import Marquee from "../components/Marquee";
import SplitReveal from "../components/SplitReveal";
import StaggerIn from "../components/StaggerIn";
import { ErrorState, EmptyState } from "../components/StateMessages";
import { CATEGORIES } from "../constants/categories";
import { getItems } from "../services/itemsApi";
import { useAsync } from "../hooks/useAsync";
import { gsap, ScrollTrigger, SplitText, useGSAP, motionOK } from "../lib/gsap";
import { useI18n, errorText } from "../lib/i18n";

/** Brand background: a red, a charcoal and a grey wave tucked into a corner (see the identity board) */
function Waves({ className = "" }) {
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="none" aria-hidden="true" className={`pointer-events-none absolute ${className}`}>
      <path data-wave d="M0 0h400c-60 70-150 80-230 110S60 190 0 260z" className="fill-ink/[0.07]" />
      <path data-wave d="M0 0h300c-50 50-120 60-180 85S40 150 0 210z" className="fill-coal-900 dark:fill-coal-700" />
      <path data-wave d="M0 0h210c-40 35-90 45-130 65S25 105 0 150z" className="fill-brand-500" />
    </svg>
  );
}

/** The big location pin standing on the campus, with its radar rings and a dashed route */
function PinScene() {
  return (
    <svg viewBox="0 0 480 440" className="h-auto w-full" aria-hidden="true">
      <defs>
        <linearGradient id="hero-pin-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5a52" />
          <stop offset="0.55" stopColor="#e10600" />
          <stop offset="1" stopColor="#a80400" />
        </linearGradient>
      </defs>

      {/* campus silhouettes */}
      <g className="fill-ink/[0.07]">
        <rect x="18" y="214" width="112" height="140" rx="5" />
        <rect x="56" y="182" width="74" height="40" rx="5" />
        <rect x="352" y="190" width="112" height="164" rx="5" />
        <rect x="326" y="246" width="44" height="108" rx="5" />
        <circle cx="158" cy="322" r="24" />
        <circle cx="316" cy="330" r="17" />
        <rect x="155" y="336" width="6" height="20" />
      </g>
      <g className="fill-surface/80">
        <path d="M34 234h18v16H34zM64 234h18v16H64zM94 234h18v16H94zM34 266h18v16H34zM64 266h18v16H64zM94 266h18v16H94zM34 298h18v16H34zM64 298h18v16H64zM94 298h18v16H94z" />
        <path d="M368 212h18v16h-18zM398 212h18v16h-18zM428 212h18v16h-18zM368 244h18v16h-18zM398 244h18v16h-18zM428 244h18v16h-18zM368 276h18v16h-18zM398 276h18v16h-18zM428 276h18v16h-18z" />
      </g>

      {/* ground and radar rings */}
      <ellipse cx="240" cy="372" rx="212" ry="46" className="fill-ink/[0.05]" />
      <ellipse data-hero-pulse cx="240" cy="372" rx="150" ry="33" className="fill-none stroke-brand-500/50" strokeWidth="2.5" />
      <ellipse data-hero-pulse cx="240" cy="372" rx="150" ry="33" className="fill-none stroke-brand-500/50" strokeWidth="2.5" />
      <ellipse data-hero-ring cx="240" cy="372" rx="118" ry="26" className="fill-brand-500/[0.08] stroke-brand-500/20" strokeWidth="1.5" />
      <ellipse data-hero-ring cx="240" cy="372" rx="70" ry="15.5" className="fill-brand-500/25" />
      <ellipse data-hero-ring cx="240" cy="372" rx="28" ry="6.5" fill="#a80400" />

      {/* dashed route ending in a small pin */}
      <g data-hero-route>
        <path d="M444 66c-34-26-84-14-92 26s-34 62-78 66" className="stroke-ink/30" strokeWidth="3" strokeDasharray="9 9" strokeLinecap="round" fill="none" />
        <path d="M446 62c-6-7-10-12-10-18a10 10 0 0 1 20 0c0 6-4 11-10 18z" className="fill-brand-300" />
        <circle cx="446" cy="44" r="3.6" className="fill-surface" />
      </g>

      {/* the pin */}
      <g data-hero-pin>
        <path d="M240 368C196 304 148 256 148 184a92 92 0 0 1 184 0c0 72-48 120-92 184z" fill="url(#hero-pin-body)" />
        <path d="M178 156a68 68 0 0 1 56-56" stroke="#fff" strokeOpacity="0.5" strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="240" cy="182" r="38" className="fill-surface" />
        <circle cx="240" cy="182" r="38" className="fill-none stroke-black/15" strokeWidth="3" />
      </g>
    </svg>
  );
}

function Hero() {
  const root = useRef(null);
  const { t, isRTL } = useI18n();

  useGSAP(
    () => {
      if (!motionOK()) return;
      const q = gsap.utils.selector(root);

      // 1. Entrance (~1.3 s). Only transform + opacity are animated, so it stays smooth.
      //    English lands letter by letter; Arabic word by word (its letters must stay joined).
      const type = isRTL ? "words" : "chars";
      const line1 = SplitText.create(q("[data-hero='line1']"), { type });
      const line2 = SplitText.create(q("[data-hero='line2']"), { type });
      const pieces = (split) => (isRTL ? split.words : split.chars);
      const letters = { y: "0.45em", opacity: 0, duration: 0.55, stagger: isRTL ? 0.09 : 0.02 };
      const ground = "240 372"; // centre of the rings, in SVG units

      const tl = gsap
        .timeline({
          paused: true,
          defaults: { ease: "power3.out" },
          onComplete: () => [line1, line2].forEach((s) => s.revert()),
        })
        .from(q("[data-wave]"), { scale: 0, transformOrigin: "0% 0%", duration: 0.9, stagger: 0.06, ease: "power4.out" }, 0)
        .from(q("[data-hero='brand']"), { y: -12, opacity: 0, duration: 0.45 }, 0.05)
        .fromTo(q("[data-logo-underline]"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, 0.4)
        .from(pieces(line1), letters, 0.15)
        .from(pieces(line2), letters, 0.3)
        .from(q("[data-hero='intro']"), { opacity: 0, y: 14, duration: 0.5 }, 0.45)
        .from(q("[data-hero='search']"), { opacity: 0, y: 16, duration: 0.5 }, 0.55)
        .from(q("[data-hero='cta'] > *"), { opacity: 0, y: 14, duration: 0.45, stagger: 0.08, clearProps: "transform,opacity" }, 0.65)
        .from(q("[data-hero='scene']"), { opacity: 0, duration: 0.5 }, 0.2)
        .from(q("[data-hero-ring]"), { scale: 0.2, opacity: 0, svgOrigin: ground, duration: 0.6, stagger: 0.07 }, 0.35)
        .from(q("[data-hero-pin]"), { y: -130, opacity: 0, duration: 0.75, ease: "back.out(1.5)" }, 0.45)
        .from(q("[data-hero-route]"), { opacity: 0, x: 16, duration: 0.5 }, 0.9);

      // 2. Idle life: the pin hovers, two radar rings spread out, the waves breathe.
      //    All paused while the hero is off screen.
      const loops = [
        gsap.to(q("[data-hero-pin]"), { y: -10, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.4 }),
        gsap.fromTo(
          q("[data-hero-pulse]"),
          { scale: 0.45, opacity: 0.9, svgOrigin: ground },
          { scale: 1.3, opacity: 0, svgOrigin: ground, duration: 2.6, ease: "power1.out", repeat: -1, stagger: 1.3, delay: 1.2 }
        ),
        gsap.to(q("[data-waves]"), { scale: 1.06, duration: 5, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 1.5, delay: 1.2 }),
      ];
      gsap.set(q("[data-hero-pulse]"), { opacity: 0 });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => loops.forEach((loop) => (self.isActive ? loop.resume() : loop.pause())),
      });

      // Start once the web fonts are in (otherwise the headline re-flows mid-animation), max 0.6 s wait.
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        tl.play();
      };
      const fallback = setTimeout(start, 600);
      document.fonts?.ready.then(start);

      // 3. The scene drifts slightly with the pointer
      let removeParallax = () => {};
      if (window.matchMedia("(pointer: fine)").matches) {
        const scene = q("[data-hero-parallax]")[0];
        const moveX = gsap.quickTo(scene, "x", { duration: 0.6, ease: "power3.out" });
        const moveY = gsap.quickTo(scene, "y", { duration: 0.6, ease: "power3.out" });
        const el = root.current;
        let rect = el.getBoundingClientRect();
        const measure = () => (rect = el.getBoundingClientRect());
        const onMove = (e) => {
          moveX(((e.clientX - rect.left) / rect.width - 0.5) * 22);
          moveY(((e.clientY - rect.top) / rect.height - 0.5) * 14);
        };
        const onLeave = () => (moveX(0), moveY(0));
        el.addEventListener("pointerenter", measure);
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        removeParallax = () => {
          el.removeEventListener("pointerenter", measure);
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      }

      return () => {
        clearTimeout(fallback);
        removeParallax();
      };
    },
    { scope: root }
  );

  return (
    <section className="container-page flex flex-1 flex-col pt-4 sm:pt-6">
      <div ref={root} className="relative isolate flex flex-1 items-center overflow-hidden rounded-[2rem] border border-ink/10 bg-surface">
        {/* brand waves in two corners (mirrored in Arabic) */}
        <div data-waves className="absolute start-0 top-0 -z-10 h-20 w-36 origin-top-left will-change-transform sm:h-28 sm:w-52 lg:h-36 lg:w-64 rtl:origin-top-right">
          <Waves className="inset-0 h-full w-full rtl:-scale-x-100" />
        </div>
        <div data-waves className="absolute bottom-0 end-0 -z-10 h-24 w-40 origin-bottom-right will-change-transform sm:h-36 sm:w-64 lg:h-52 lg:w-[26rem] rtl:origin-bottom-left">
          <Waves className="inset-0 h-full w-full rotate-180 rtl:-scale-x-100" />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-paper via-surface to-paper-2" />

        <div className="relative grid w-full items-center gap-10 px-6 pb-14 pt-20 sm:px-12 sm:pb-16 sm:pt-24 lg:grid-cols-12 lg:gap-12 lg:px-16 lg:py-20">
          <div className="lg:col-span-7">
            {/* FindIt title + slogan */}
            <div data-hero="brand">
              <Logo size={64} light={false} tagline />
            </div>

            <h1 className="display mt-8 text-[1.75rem] italic text-ink sm:text-5xl lg:text-6xl rtl:not-italic" aria-label={t("hero.aria")}>
              <span data-hero="line1" className="block">{t("hero.line1")}</span>
              <span data-hero="line2" className="block">
                {t("hero.line2")} <span className="text-brand-500">{t("hero.line2Accent")}</span>
              </span>
            </h1>

            <p data-hero="intro" className="mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
              {t("hero.intro")}
            </p>

            <div data-hero="search" className="mt-8 max-w-xl">
              <SearchBar rotatingWords={t("search.words")} />
            </div>

            <div data-hero="cta" className="mt-5 flex flex-wrap gap-3">
              {/* plain wrappers: GSAP animates these, the buttons keep their own CSS transitions */}
              <span>
                <Link to="/report/lost" data-magnetic className="btn btn-primary">
                  <Icon name="backpack" className="h-4.5 w-4.5" />
                  {t("nav.reportLost")}
                  <Icon name="chevron-right" className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
              </span>
              <span>
                <Link to="/report/found" data-magnetic className="btn btn-dark">
                  <Icon name="other" className="h-4.5 w-4.5" />
                  {t("nav.reportFound")}
                  <Icon name="chevron-right" className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
              </span>
            </div>
          </div>

          <div data-hero="scene" className="mx-auto hidden w-full max-w-md md:block lg:col-span-5">
            <div data-hero-parallax className="will-change-transform">
              <PinScene />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = ["report", "match", "reunite"];

function HowItWorks() {
  const root = useRef(null);
  const { t } = useI18n();

  // The two rules draw themselves while the three steps rise one after another
  useGSAP(
    () => {
      if (!motionOK()) return;
      const q = gsap.utils.selector(root);
      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          scrollTrigger: { trigger: root.current, start: "top 90%", once: true },
        })
        .from(q("[data-rule]"), { scaleX: 0, duration: 0.7, stagger: 0.08 }, 0)
        .from(q("[data-step]"), { opacity: 0, y: 22, duration: 0.55, stagger: 0.09, clearProps: "transform,opacity" }, 0.08)
        .from(q("[data-step-n]"), { scale: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.09, clearProps: "transform" }, 0.15);
    },
    { scope: root }
  );

  return (
    <section className="container-page section-screen flex flex-col justify-center py-20">
      <SectionTitle eyebrow={t("steps.eyebrow")} title={t("steps.title")} subtitle={t("steps.subtitle")} />
      <div ref={root} className="relative">
        <span data-rule className="absolute inset-x-0 top-0 h-px origin-left bg-ink/15 rtl:origin-right" aria-hidden="true" />
        <ol className="grid divide-y divide-ink/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          {STEPS.map((step, i) => (
            <li key={step} className="py-9 md:px-8 md:py-12 md:first:ps-0 md:last:pe-0">
              <div data-step className="flex gap-5">
                <span data-step-n className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-bold tabular-nums text-white shadow-[0_10px_22px_-12px_rgba(225,6,0,0.75)]">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="display text-3xl text-ink">{t(`steps.${step}.title`)}</h3>
                  <p className="mt-3 max-w-xs leading-relaxed text-muted">{t(`steps.${step}.text`)}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <span data-rule className="absolute inset-x-0 bottom-0 h-px origin-left bg-ink/15 rtl:origin-right" aria-hidden="true" />
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-3 text-brand-ink">{eyebrow}</p>}
        <SplitReveal as="h2" className="display text-3xl text-ink sm:text-4xl">
          {title}
        </SplitReveal>
        {subtitle && (
          <SplitReveal as="p" delay={0.12} stagger={0.025} className="mt-3 text-muted">
            {subtitle}
          </SplitReveal>
        )}
      </div>
      {action}
    </div>
  );
}

function CategoriesSection() {
  const { t } = useI18n();
  return (
    <section className="container-page section-screen flex flex-col justify-center py-20">
      <SectionTitle eyebrow={t("categoriesSection.eyebrow")} title={t("categoriesSection.title")} subtitle={t("categoriesSection.subtitle")} />
      {/* tiles are dealt onto the table one after another */}
      <StaggerIn variant="deal" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {CATEGORIES.map((c, i) => (
          <div key={c.slug} className={i === 0 ? "col-span-2" : ""}>
            <CategoryCard category={c} featured={i === 0} className="h-full" />
          </div>
        ))}
      </StaggerIn>
    </section>
  );
}

function LatestItemsSection() {
  const { t, lang } = useI18n();
  const { data: items, loading, error, retry } = useAsync((signal) => getItems({ limit: 8, signal, lang }), [lang]);

  return (
    <section className="section-screen flex flex-col justify-center border-y border-ink/10 bg-paper-2/60 py-20">
      <div className="container-page">
        <SectionTitle
          eyebrow={t("latest.eyebrow")}
          title={t("latest.title")}
          subtitle={t("latest.subtitle")}
          action={
            <Link to="/items" data-magnetic className="btn btn-ghost bg-surface/60">
              {t("latest.viewAll")}
              <Icon name="arrow" className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          }
        />

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && error && <ErrorState message={errorText(t, error)} onRetry={retry} />}

        {!loading && !error && items?.length === 0 && <EmptyState title={t("latest.emptyTitle")}>{t("latest.emptyText")}</EmptyState>}

        {!loading && !error && items?.length > 0 && (
          <StaggerIn variant="rise" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.id}>
                <ItemCard item={item} className="h-full" />
              </div>
            ))}
          </StaggerIn>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useI18n();
  return (
    <>
      {/* first screen: the hero fills what the nav bar leaves, the word band closes it */}
      <div className="section-screen-first flex flex-col">
        <Hero />
        <Marquee words={t("marquee")} className="mt-5 sm:mt-6" />
      </div>
      <HowItWorks />
      <CategoriesSection />
      <LatestItemsSection />
    </>
  );
}
