import { useI18n } from "../lib/i18n";

/**
 * FindIt logo: a magnifying glass with a location pin inside, three "found it!" sparks,
 * and the wordmark "Find" + red "It" (the wordmark stays in Latin letters in every language).
 *
 * Props
 *  - size      height of the mark in px (default 36)
 *  - withText  show the wordmark (default true)
 *  - light     true = white glass and text, for dark surfaces (footer) · false = follows the theme
 *  - tagline   also show the hand-written slogan with its red underline (translated)
 */
export function LogoMark({ size = 36, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
      {/* sparks */}
      <path d="M8 12l5 4M4 23l6 1.5M15 4.5l2.5 5.5M47 5l-2.5 5.5M55 11l-5 4" stroke="#e10600" strokeWidth="3" strokeLinecap="round" />
      {/* glass (takes the text colour) */}
      <circle cx="30" cy="32" r="16.5" stroke="currentColor" strokeWidth="5.5" />
      <path d="M43 45l13 13" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      {/* pin */}
      <path d="M30 43c-4.4-5-7.4-8.6-7.4-12.6a7.4 7.4 0 0 1 14.8 0C37.4 34.4 34.4 38 30 43z" fill="#e10600" />
      <circle cx="30" cy="30.2" r="2.8" fill="#fff" />
    </svg>
  );
}

export default function Logo({ size = 36, withText = true, light = true, tagline = false }) {
  const { t } = useI18n();
  const tone = light ? "text-white" : "text-ink";

  return (
    <span className={`inline-flex items-center gap-2 ${tone}`}>
      <LogoMark size={size} />
      {withText && (
        <span className="flex flex-col leading-none">
          <span dir="ltr" lang="en" className="self-start font-sans font-extrabold tracking-tight" style={{ fontSize: Math.round(size * 0.6) }}>
            Find<span className="text-brand-500">It</span>
          </span>
          {tagline && (
            <span className="relative mt-0.5 self-start whitespace-nowrap font-hand font-bold leading-tight" style={{ fontSize: Math.round(size * 0.42) }}>
              {t("brand.tagline")}
              <svg
                className="absolute -bottom-1 start-[28%] h-2 w-[72%] text-brand-500"
                viewBox="0 0 200 10"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <path
                  data-logo-underline
                  d="M3 7C50 2 110 2 197 5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength="1"
                  strokeDasharray="1"
                />
              </svg>
            </span>
          )}
        </span>
      )}
    </span>
  );
}
