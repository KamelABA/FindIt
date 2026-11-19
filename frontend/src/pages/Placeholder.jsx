import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import SplitReveal from "../components/SplitReveal";
import { useI18n } from "../lib/i18n";

/**
 * Temporary page for routes owned by other team members (report forms, login…).
 * Props: titleKey (a key of locales, e.g. "placeholder.login") or title (plain text), owner
 */
export default function Placeholder({ titleKey, title, owner }) {
  const { t } = useI18n();
  const heading = titleKey ? t(titleKey) : title;

  return (
    <div className="container-page py-28 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-ink">
        <Icon name="tool" className="h-7 w-7" />
      </span>
      <p className="eyebrow mt-6 text-brand-ink">{t("placeholder.badge")}</p>
      <SplitReveal as="h1" scroll={false} className="display mt-3 text-4xl text-ink">
        {heading}
      </SplitReveal>
      <p className="mt-3 text-muted">
        {t("placeholder.text")}
        {owner ? ` (${owner})` : ""}
      </p>
      <Link to="/" data-magnetic className="btn btn-dark mt-8">{t("placeholder.back")}</Link>
    </div>
  );
}
