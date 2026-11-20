import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { gsap, motionOK } from "../lib/gsap";
import { useInstallApp } from "../lib/install";
import { useI18n } from "../lib/i18n";

// Icons of the manual steps, shown when the browser has no one-click install (Safari, Firefox…).
// The texts are in locales: install.ios / install.android / install.desktop
const GUIDE_ICONS = {
  ios: ["share", "plus-square", "smartphone"],
  android: ["more", "download", "smartphone"],
  desktop: ["monitor", "download", "smartphone"],
};

/** A phone screen with the FindIt icon among other apps: explains "install" without words */
function PhoneMockup() {
  return (
    <div className="flex justify-center rounded-2xl bg-paper-2 px-6 pt-6" aria-hidden="true">
      <div className="relative w-44 rounded-t-[1.75rem] border-[6px] border-b-0 border-coal-900 bg-surface px-3 pb-3 pt-5 shadow-xl dark:border-coal-500">
        <span className="absolute left-1/2 top-1.5 h-1.5 w-12 -translate-x-1/2 rounded-full bg-coal-900 dark:bg-coal-500" />
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="aspect-square rounded-lg bg-ink/10" />
          ))}
          <img
            data-install-icon
            src="/icons/icon-192.png"
            alt=""
            width="192"
            height="192"
            className="aspect-square w-full rounded-lg ring-2 ring-brand-500"
          />
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={`b${i}`} className="aspect-square rounded-lg bg-ink/10" />
          ))}
        </div>
        <p className="mt-1 grid grid-cols-4 gap-2.5 text-center text-[9px] font-bold text-ink">
          <span className="col-start-4">FindIt</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Install button + dialog.
 * - variant "icon" (default): round icon button for the nav bar
 * - variant "button": full button with a label (mobile menu, footer…)
 * Renders nothing when FindIt already runs as an installed app.
 */
export default function InstallApp({ variant = "icon", className = "" }) {
  const { t, isRTL } = useI18n();
  const { status, platform, promptInstall } = useInstallApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const dialog = useRef(null);

  // Native <dialog>: focus trap, Escape and the backdrop come from the browser
  useEffect(() => {
    const el = dialog.current;
    if (!open || !el) return;
    if (!el.open) el.showModal();
    if (!motionOK()) return;
    const ctx = gsap.context(() => {
      gsap.from(el, { opacity: 0, y: 24, scale: 0.97, duration: 0.35, ease: "power3.out", clearProps: "transform,opacity" });
      gsap.from("[data-install-icon]", { scale: 0, duration: 0.5, ease: "back.out(2)", delay: 0.2 });
      const steps = el.querySelectorAll("[data-install-step]"); // absent when one-click install is offered
      if (steps.length) gsap.from(steps, { opacity: 0, x: isRTL ? 12 : -12, duration: 0.35, stagger: 0.07, delay: 0.15, ease: "power3.out" });
    }, el);
    return () => ctx.revert();
  }, [open, isRTL]);

  if (status === "installed") return null;

  const guide = GUIDE_ICONS[platform] ? platform : "desktop";
  const steps = t(`install.${guide}.steps`);
  const close = () => dialog.current?.close();

  const install = async () => {
    setBusy(true);
    const outcome = await promptInstall();
    setBusy(false);
    if (outcome === "accepted") close();
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("install.aria")}
          title={t("install.tooltip")}
          className={`btn-icon relative ${className}`}
        >
          <Icon name="download" />
          {/* red dot: this browser can install in one click */}
          {status === "prompt" && <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-surface" />}
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className={`btn btn-ghost ${className}`}>
          <Icon name="download" className="h-4 w-4" />
          {t("install.cta")}
        </button>
      )}

      {open && (
        <dialog
          ref={dialog}
          className="app-dialog"
          aria-labelledby="install-title"
          onClose={() => setOpen(false)}
          onClick={(e) => e.target === dialog.current && close()} // click on the backdrop
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="install-title" className="display text-2xl text-ink">{t("install.title")}</h2>
              <p className="mt-1 text-sm text-muted">{t("install.subtitle")}</p>
            </div>
            <button type="button" onClick={close} aria-label={t("install.close")} className="btn-icon -me-1 -mt-1">
              <Icon name="close" />
            </button>
          </div>

          <div className="mt-5 space-y-5">
            <PhoneMockup />

            {status === "prompt" ? (
              <button type="button" className="btn btn-primary w-full" onClick={install} disabled={busy} aria-busy={busy || undefined}>
                <Icon name="download" className="h-4 w-4" />
                {busy ? t("install.installing") : t("install.now")}
              </button>
            ) : (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-ink">{t(`install.${guide}.title`)}</h3>
                <ol className="space-y-3">
                  {steps.map((text, i) => (
                    <li key={text} data-install-step className="flex items-start gap-3">
                      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper-2 text-ink-2">
                        <Icon name={GUIDE_ICONS[guide][i]} />
                        <span className="absolute -start-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-[11px] font-bold tabular-nums text-white">
                          {i + 1}
                        </span>
                      </span>
                      <span className="pt-2 text-sm leading-relaxed text-ink-2">{text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <p className="flex items-center justify-center gap-2 border-t border-ink/10 pt-4 text-xs text-muted">
              <img src="/brand/cybernexus-mark.jpg" alt="" width="20" height="20" className="h-5 w-5 rounded-md" />
              {t("install.owner")}
            </p>
          </div>
        </dialog>
      )}
    </>
  );
}
