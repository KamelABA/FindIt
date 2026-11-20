/**
 * Title block at the top of every dashboard page.
 * Props: eyebrow, title, subtitle, actions (buttons shown on the end side)
 */
export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-6">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2 text-brand-ink">{eyebrow}</p>}
        <h1 className="display text-3xl text-ink sm:text-4xl" dir="auto">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
