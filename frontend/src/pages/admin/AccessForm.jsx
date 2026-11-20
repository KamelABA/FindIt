import { useId, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import Logo from "../../components/Logo";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSwitch from "../../components/LanguageSwitch";
import { useI18n, errorText } from "../../lib/i18n";

/** Readable reason why the email was refused */
function accessErrorText(t, error) {
  if (error.status === 401) return t("admin.access.noAccount");
  if (error.code === "suspended") return t("admin.access.suspended");
  if (error.status === 403) return t("admin.access.notAdmin");
  if (error.status === 503) return t("admin.access.disabled");
  return errorText(t, error);
}

/**
 * TEMPORARY sign-in, until login / password exist: the admin types an email,
 * the backend accepts it only if that account has role = admin or super_admin (and is not suspended).
 */
export default function AccessForm({ onSubmit, checking, error }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const id = useId();

  const submit = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (value) onSubmit(value);
  };

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to="/" aria-label={t("nav.homeAria")}>
          <Logo light={false} size={28} />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitch className="h-9! w-9!" />
          <ThemeToggle className="h-9! w-9!" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-ink/10 bg-surface p-8 shadow-[0_22px_40px_-28px_rgba(0,0,0,0.5)]">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-ink">
            <Icon name="shield" className="h-6 w-6" />
          </span>
          <p className="eyebrow mt-6 text-brand-ink">{t("admin.eyebrow")}</p>
          <h1 className="display mt-2 text-3xl text-ink">{t("admin.access.title")}</h1>
          <p className="mt-3 text-sm text-muted">{t("admin.access.text")}</p>

          <label htmlFor={id} className="mt-6 block text-sm font-semibold text-ink">
            {t("admin.access.email")}
          </label>
          <input
            id={id}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("admin.access.placeholder")}
            dir="ltr"
            className="mt-2 w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink transition placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
          />

          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-lost">
              {accessErrorText(t, error)}
            </p>
          )}

          <button type="submit" disabled={checking} className="btn btn-primary mt-6 w-full disabled:opacity-60">
            {checking ? t("admin.access.checking") : t("admin.access.submit")}
          </button>
        </form>
      </main>
    </div>
  );
}
