import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Icon from "../Icon";
import { useI18n } from "../../lib/i18n";

/**
 * Side panel for details and editing (slides in from the end side; full width on phones).
 * Escape, the backdrop and the close button close it; focus moves in and comes back on close.
 *
 * Props: open, onClose, title, subtitle, children, footer (sticky action bar)
 */
export default function Drawer({ open, onClose, title, subtitle, children, footer }) {
  const { t } = useI18n();
  const panel = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    document.body.style.overflow = "hidden";
    panel.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab" || !panel.current) return;
      // keep Tab inside the panel
      const focusable = panel.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-coal-900/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="drawer-in relative flex h-full w-full max-w-xl flex-col bg-paper shadow-2xl focus:outline-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-bold text-ink" dir="auto">{title}</h2>
            {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label={t("admin.drawer.close")} className="btn-icon h-9! w-9! shrink-0 border border-ink/15 text-ink">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <footer className="border-t border-ink/10 bg-surface px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}

/** Label / value row inside a drawer */
export function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 border-b border-ink/[0.07] py-2.5 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children ?? "—"}</dd>
    </div>
  );
}

/** Titled block inside a drawer */
export function DrawerSection({ title, children, className = "" }) {
  return (
    <section className={`mt-7 first:mt-0 ${className}`}>
      <h3 className="eyebrow mb-3 text-muted">{title}</h3>
      {children}
    </section>
  );
}
