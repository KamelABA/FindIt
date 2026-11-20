import { Link } from "react-router-dom";
import Logo from "./Logo";
import InstallApp from "./InstallApp";
import SplitReveal from "./SplitReveal";
import { CATEGORIES, categoryLabel } from "../constants/categories";
import { useI18n } from "../lib/i18n";

const linkClass = "inline-block py-1 transition hover:text-white";

export default function Footer() {
  const { t, lang } = useI18n();
  const motto = t("footer.motto");

  return (
    <footer className="bg-coal-900 text-white/65 dark:border-t dark:border-white/10">
      <div className="container-page">
        <div className="flex flex-col gap-6 border-b border-white/10 py-14 lg:flex-row lg:items-end lg:justify-between">
          {/* key = language, so the words are revealed again after a language switch */}
          <SplitReveal key={lang} as="p" className="display max-w-xl text-3xl italic text-white sm:text-4xl rtl:not-italic">
            {t("footer.tagline")} <span className="text-brand-300">{t("footer.taglineAccent")}</span>
          </SplitReveal>
          <div className="flex flex-wrap gap-3">
            <Link to="/report/lost" data-magnetic className="btn btn-primary">{t("nav.reportLost")}</Link>
            <Link to="/report/found" data-magnetic className="btn btn-outline">{t("nav.reportFound")}</Link>
          </div>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed">{t("footer.about")}</p>
            <InstallApp variant="button" className="border-white/30! text-white! hover:border-white/60! hover:bg-white/10!" />
          </div>

          <div className="lg:col-span-2">
            <h3 className="eyebrow mb-4 text-brand-300">{t("footer.platform")}</h3>
            <ul className="text-sm">
              <li><Link className={linkClass} to="/items">{t("nav.browse")}</Link></li>
              <li><Link className={linkClass} to="/report/lost">{t("nav.reportLost")}</Link></li>
              <li><Link className={linkClass} to="/report/found">{t("nav.reportFound")}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="eyebrow mb-4 text-brand-300">{t("footer.categories")}</h3>
            <ul className="text-sm">
              {CATEGORIES.slice(0, 4).map((c) => (
                <li key={c.slug}>
                  <Link className={linkClass} to={`/items?category=${c.slug}`}>{categoryLabel(t, c.slug)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="eyebrow mb-4 text-brand-300">{t("footer.help")}</h3>
            <p className="text-sm leading-relaxed">{t("footer.helpText")}</p>
          </div>
        </div>

        {/* Ownership: FindIt belongs to the CyberNexus scientific club */}
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:gap-5">
          <img
            src="/brand/cybernexus-mark.jpg"
            alt={t("footer.logoAlt")}
            width="256"
            height="256"
            loading="lazy"
            decoding="async"
            className="h-16 w-16 shrink-0 rounded-2xl ring-1 ring-white/15"
          />
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-white/55">{t("footer.ownedBy")}</p>
            <p className="cyber-text mt-1 inline-block text-2xl font-extrabold tracking-[0.08em]" lang="en">CYBERNEXUS</p>
            <p className="text-sm text-white/70">{t("footer.club")}</p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55 sm:text-end">
            {motto.map((word, i) => (
              <span key={word}>
                {i > 0 && <span className="px-1.5 text-brand-300">·</span>}
                {word}
              </span>
            ))}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 py-6 text-xs text-white/45">
          <span>{t("footer.rights", new Date().getFullYear())}</span>
          <span>{t("footer.project")}</span>
        </div>
      </div>
    </footer>
  );
}
