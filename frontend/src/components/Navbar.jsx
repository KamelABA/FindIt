import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "./Logo";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitch from "./LanguageSwitch";
import InstallApp from "./InstallApp";
import { AUTH_ENABLED } from "../config/env";
import { gsap, motionOK } from "../lib/gsap";
import { useI18n } from "../lib/i18n";

const LINKS = [
  { to: "/", key: "nav.home", end: true },
  { to: "/items", key: "nav.browse" },
  { to: "/report/lost", key: "nav.reportLost" },
  { to: "/report/found", key: "nav.reportFound" },
];

// The text colour follows the sliding highlight (data-lit), not the "active" state,
// so a link stays readable both on the highlight and off it (see .nav-link in index.css).
const desktopLink =
  "nav-link relative z-10 inline-flex min-h-8 items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150";

// round buttons inside the slim bar: 36px (they are 40px everywhere else)
const slimIcon = "h-9! w-9!";

const mobileLink = ({ isActive }) =>
  `flex min-h-16 items-center justify-between border-b border-ink/10 py-3 font-display text-3xl font-extrabold tracking-tight ${
    isActive ? "text-brand-ink" : "text-ink"
  }`;

/** "by CyberNexus": the scientific club that owns the platform */
function OwnerTag({ className = "" }) {
  const { t } = useI18n();
  return (
    <span className={`items-center gap-1.5 whitespace-nowrap border-s border-ink/15 ps-3 text-[11px] font-medium text-muted ${className}`}>
      <img src="/brand/cybernexus-mark.jpg" alt="" width="20" height="20" className="h-4.5 w-4.5 rounded-md" />
      {t("nav.by")} <span className="cyber-text font-bold tracking-wide">CYBERNEXUS</span>
    </span>
  );
}

export default function Navbar() {
  const location = useLocation();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);

  const header = useRef(null);
  const list = useRef(null);
  const pill = useRef(null);
  const overlay = useRef(null);
  const burger = useRef(null);
  const placed = useRef(false);

  /* ── Sliding highlight behind the hovered / active link ───────────────────
     offsetLeft is a physical coordinate, so `left-0` + x works in both writing directions. */
  const moveTo = useCallback((el, instant = false) => {
    const highlight = pill.current;
    if (!highlight) return;

    list.current?.querySelectorAll("[data-lit]").forEach((n) => n.removeAttribute("data-lit"));
    if (!el) {
      gsap.to(highlight, { opacity: 0, duration: instant ? 0 : 0.2, overwrite: true });
      return;
    }
    el.setAttribute("data-lit", "true");
    const to = { x: el.offsetLeft, width: el.offsetWidth, opacity: 1 };
    if (instant || !placed.current || !motionOK()) {
      gsap.killTweensOf(highlight); // a glide still running would land on the old size
      gsap.set(highlight, to);
      placed.current = true;
    } else {
      gsap.to(highlight, { ...to, duration: 0.4, ease: "power3.out", overwrite: true });
    }
  }, []);

  const activeEl = useCallback(() => list.current?.querySelector('[aria-current="page"]') ?? null, []);

  // follow the route
  useLayoutEffect(() => {
    moveTo(activeEl());
  }, [location.pathname, moveTo, activeEl]);

  // a new language changes every width and the direction: re-place at once, without gliding
  useLayoutEffect(() => {
    moveTo(activeEl(), true);
  }, [lang, moveTo, activeEl]);

  // stay glued to the link whenever the tray changes size (fonts arriving, window resize)
  useEffect(() => {
    const realign = () => moveTo(activeEl(), true);
    const observer = new ResizeObserver(realign);
    if (list.current) observer.observe(list.current);
    window.addEventListener("resize", realign);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", realign);
    };
  }, [moveTo, activeEl]);

  /* ── The capsule drops in once on load ──────────────────────────────────── */
  useLayoutEffect(() => {
    if (!motionOK()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from("[data-nav-enter]", { y: -20, opacity: 0, duration: 0.55, ease: "power3.out", clearProps: "transform,opacity" });
    }, header);
    return () => ctx.revert();
  }, []);

  /* ── Full-screen menu on phones and tablets ─────────────────────────────── */
  const closeMenu = useCallback(() => {
    setOpen(false);
    burger.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const el = overlay.current;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      if (!motionOK()) return;
      gsap.from(el, { clipPath: "inset(0 0 100% 0)", duration: 0.45, ease: "power3.inOut", clearProps: "clipPath" });
      gsap.from("[data-menu-item]", {
        y: 26,
        opacity: 0,
        duration: 0.45,
        ease: "power3.out",
        stagger: 0.05,
        delay: 0.15,
        clearProps: "transform,opacity",
      });
    }, el);

    el.querySelector("nav a")?.focus();
    const onKey = (e) => e.key === "Escape" && closeMenu();
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      ctx.revert();
    };
  }, [open, closeMenu]);

  // a link was followed: close the menu
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  return (
    <>
      <header ref={header} className="sticky top-0 z-50 px-3 pt-2.5 print:hidden">
        <div
          data-nav-enter
          className="nav-pill mx-auto flex max-w-6xl items-center justify-between gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" aria-label={t("nav.homeAria")} className="flex min-h-9 shrink-0 items-center rounded-full pe-1">
              <Logo light={false} size={30} />
            </Link>
            <OwnerTag className="hidden xl:inline-flex" />
          </div>

          {/* Desktop links with the sliding highlight */}
          <nav aria-label={t("nav.main")} className="hidden lg:block lg:justify-self-center">
            <ul
              ref={list}
              className="nav-tray relative flex items-center gap-0.5 rounded-full p-0.5"
              onMouseLeave={() => moveTo(activeEl())}
            >
              <li aria-hidden="true" className="contents">
                <span
                  ref={pill}
                  className="pointer-events-none absolute bottom-0.5 left-0 top-0.5 rounded-full bg-brand-500 opacity-0 will-change-transform"
                />
              </li>
              {LINKS.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.end}
                    className={desktopLink}
                    onMouseEnter={(e) => moveTo(e.currentTarget)}
                    onFocus={(e) => moveTo(e.currentTarget)}
                    onBlur={() => moveTo(activeEl())}
                  >
                    {t(l.key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1 lg:justify-self-end">
            <LanguageSwitch className={slimIcon} />
            <ThemeToggle className={slimIcon} />
            <InstallApp className={slimIcon} />

            {AUTH_ENABLED && (
              <>
                <Link
                  to="/login"
                  className="hidden min-h-9 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:text-ink lg:inline-flex"
                >
                  {t("nav.login")}
                </Link>
                <Link to="/register" className="btn btn-primary hidden min-h-9! whitespace-nowrap px-4! py-1.5! text-[13px]! lg:inline-flex">
                  {t("nav.register")}
                </Link>
              </>
            )}

            <button
              ref={burger}
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("nav.openMenu")}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={`btn-icon nav-tray text-ink lg:hidden ${slimIcon}`}
            >
              <Icon name="menu" />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          id="mobile-menu"
          ref={overlay}
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.menu")}
          className="mobile-menu fixed inset-0 z-[60] flex flex-col overflow-y-auto px-5 pb-6 pt-4 lg:hidden"
        >
          <div className="flex items-center justify-between">
            <Logo light={false} />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button type="button" onClick={closeMenu} aria-label={t("nav.closeMenu")} className="btn-icon nav-tray text-ink">
                <Icon name="close" />
              </button>
            </div>
          </div>

          <nav aria-label={t("nav.menu")} className="mt-8 flex-1">
            <ul>
              {LINKS.map((l, i) => (
                <li key={l.to} data-menu-item>
                  <NavLink to={l.to} end={l.end} className={mobileLink} onClick={() => setOpen(false)}>
                    <span>{t(l.key)}</span>
                    <span className="text-sm font-semibold tabular-nums text-muted" aria-hidden="true">
                      0{i + 1}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div data-menu-item className="mt-6 grid gap-2">
            {AUTH_ENABLED && (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn btn-ghost">{t("nav.login")}</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn btn-primary">{t("nav.register")}</Link>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <LanguageSwitch variant="button" />
              <InstallApp variant="button" />
            </div>
          </div>

          <p data-menu-item className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted">
            <img src="/brand/cybernexus-mark.jpg" alt="" width="24" height="24" className="h-6 w-6 rounded-md" />
            {t("nav.ownerLine")} <span className="cyber-text font-bold tracking-wide">CYBERNEXUS</span> · {t("nav.club")}
          </p>
        </div>
      )}
    </>
  );
}
