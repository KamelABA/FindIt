import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import Logo from "../../components/Logo";
import Icon from "../../components/Icon";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSwitch from "../../components/LanguageSwitch";
import { Spinner } from "../../components/StateMessages";
import { getAdminEmail, setAdminEmail, getMe, getStats, onAdminDenied } from "../../services/adminApi";
import { useI18n } from "../../lib/i18n";
import AccessForm from "./AccessForm";

/* ── Session ──────────────────────────────────────────────────────────────────
   TEMPORARY, until login / password exist: the email is checked by the backend (the account must
   have is_admin = true in the database) and remembered in localStorage.
   When the real login is merged, take the user from it here and delete AccessForm. */
function useAdminSession() {
  const [state, setState] = useState(() => ({ admin: null, checking: Boolean(getAdminEmail()), error: null }));

  const signIn = useCallback(async (email, signal) => {
    setState((s) => ({ ...s, checking: true, error: null }));
    try {
      const admin = await getMe(email, { signal });
      setAdminEmail(admin.email);
      setState({ admin, checking: false, error: null });
    } catch (error) {
      if (error.name === "AbortError") return;
      if (error.status) setAdminEmail(""); // refused by the server (not a network problem): forget it
      setState({ admin: null, checking: false, error });
    }
  }, []);

  const signOut = useCallback((error = null) => {
    setAdminEmail("");
    setState({ admin: null, checking: false, error });
  }, []);

  // re-check the remembered email on every visit: admin rights may have changed in the database
  useEffect(() => {
    const email = getAdminEmail();
    if (!email) return undefined;
    const controller = new AbortController();
    signIn(email, controller.signal);
    return () => controller.abort();
  }, [signIn]);

  // any admin request refused later (is_admin switched off, account suspended…) signs out
  useEffect(() => onAdminDenied((error) => signOut(error)), [signOut]);

  return { ...state, signIn, signOut };
}

/* ── Context: the signed-in admin + the counters shown in the sidebar ───────── */
const AdminContext = createContext(null);

/** { admin, signOut, totals, refreshCounts } */
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used inside the admin dashboard");
  return context;
}

const NAV = [
  { to: "/admin", key: "overview", icon: "grid", end: true },
  { to: "/admin/users", key: "users", icon: "users", badge: (t) => t?.users.pending },
  { to: "/admin/lost", key: "lost", icon: "search", badge: (t) => t?.items.pending_lost },
  { to: "/admin/found", key: "found", icon: "check", badge: (t) => t?.items.pending_found },
  { to: "/admin/claims", key: "claims", icon: "inbox", badge: (t) => t?.claims.pending },
  { to: "/admin/reports", key: "reports", icon: "chart" },
  { to: "/admin/logs", key: "logs", icon: "history" },
];

function SidebarNav({ totals, onNavigate }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t("admin.nav.label")} className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {NAV.map((link) => {
          const badge = link.badge?.(totals);
          return (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                    isActive ? "bg-brand-500 text-white" : "text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name={link.icon} className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1">{t(`admin.nav.${link.key}`)}</span>
                    {badge > 0 && (
                      <span
                        className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums ${
                          isActive ? "bg-white text-brand-600" : "bg-brand-500 text-white"
                        }`}
                        aria-label={t("admin.nav.pending", badge)}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFooter() {
  const { t } = useI18n();
  return (
    <div className="border-t border-ink/10 px-3 py-4">
      <Link to="/" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted hover:bg-ink/[0.05] hover:text-ink">
        <Icon name="external" className="h-4 w-4" />
        {t("admin.nav.site")}
      </Link>
    </div>
  );
}

function Shell({ admin, signOut, totals }) {
  const { t } = useI18n();
  const location = useLocation();
  const [menu, setMenu] = useState(false);

  useEffect(() => setMenu(false), [location.pathname]);
  useEffect(() => {
    if (!menu) return undefined;
    const onKey = (e) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menu]);

  return (
    <div className="min-h-screen font-sans lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-e border-ink/10 bg-surface lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-ink/10 px-5">
          <Logo light={false} size={28} />
        </div>
        <p className="eyebrow px-6 pt-5 text-muted">{t("admin.eyebrow")}</p>
        <SidebarNav totals={totals} />
        <SidebarFooter />
      </aside>

      {/* sidebar (phones / tablets) */}
      {menu && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={t("admin.nav.label")}>
          <div className="absolute inset-0 bg-coal-900/50" onClick={() => setMenu(false)} aria-hidden="true" />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-ink/10 px-5">
              <Logo light={false} size={28} />
              <button type="button" onClick={() => setMenu(false)} aria-label={t("nav.closeMenu")} className="btn-icon h-9! w-9! border border-ink/15 text-ink">
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav totals={totals} onNavigate={() => setMenu(false)} />
            <SidebarFooter />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-ink/10 bg-paper/85 px-4 backdrop-blur sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => setMenu(true)}
            aria-label={t("nav.openMenu")}
            aria-expanded={menu}
            className="btn-icon h-9! w-9! border border-ink/15 text-ink lg:hidden"
          >
            <Icon name="menu" className="h-4 w-4" />
          </button>
          <p className="me-auto min-w-0 truncate text-sm text-muted">
            <span className="hidden sm:inline">{t("admin.signedInAs")} </span>
            <strong className="font-semibold text-ink" dir="auto">{admin.full_name}</strong>
          </p>
          <LanguageSwitch className="h-9! w-9!" />
          <ThemeToggle className="h-9! w-9!" />
          <button
            type="button"
            onClick={() => signOut()}
            className="ms-1 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ink/15 px-3 text-[13px] font-semibold text-ink-2 hover:text-ink"
          >
            <Icon name="logout" className="h-4 w-4 rtl:-scale-x-100" />
            <span className="hidden sm:inline">{t("admin.signOut")}</span>
          </button>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

/** Protects every /admin route: shows the sign-in form until the backend confirms an admin. */
export default function AdminLayout() {
  const { admin, checking, error, signIn, signOut } = useAdminSession();
  const [totals, setTotals] = useState(null);
  const [version, setVersion] = useState(0);
  const refreshCounts = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!admin) return undefined;
    const controller = new AbortController();
    getStats({ weeks: 1, signal: controller.signal })
      .then((stats) => setTotals(stats.totals))
      .catch(() => {}); // the badges are a convenience: pages show their own errors
    return () => controller.abort();
  }, [admin, version]);

  const value = useMemo(() => ({ admin, signOut, totals, refreshCounts }), [admin, signOut, totals, refreshCounts]);

  if (checking && !admin) return <Spinner />;
  if (!admin) return <AccessForm onSubmit={(email) => signIn(email)} checking={checking} error={error} />;

  return (
    <AdminContext.Provider value={value}>
      <Shell admin={admin} signOut={signOut} totals={totals} />
    </AdminContext.Provider>
  );
}
