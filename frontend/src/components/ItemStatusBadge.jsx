import { ITEM_TYPES } from "../constants/categories";
import { useI18n } from "../lib/i18n";

// glyph drawn inside the small coloured disc
const GLYPH = {
  lost: <path d="M12 6.5v7M12 17.2v.3" />, // "!"
  found: <path d="m7.2 12.4 3.2 3.2 6.4-6.8" />, // check
};

/**
 * Shows "Lost" (red, exclamation disc) or "Found" (green, check disc) – as in the brand identity.
 * Props: type: "lost" | "found", size: "sm" | "md", className
 */
export default function ItemStatusBadge({ type, size = "sm", className = "" }) {
  const { t } = useI18n();
  const key = ITEM_TYPES[type] ? type : "lost";
  const conf = ITEM_TYPES[key];
  const md = size === "md";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ring-inset ${conf.className} ${
        md ? "gap-2 py-1 ps-1 pe-3.5 text-sm" : "gap-1.5 py-0.5 ps-0.5 pe-2.5 text-xs"
      } ${className}`}
    >
      <span className={`grid shrink-0 place-items-center rounded-full ${conf.disc} ${md ? "h-6 w-6" : "h-[18px] w-[18px]"}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="h-[72%] w-[72%]">
          {GLYPH[key]}
        </svg>
      </span>
      {t(`types.${key}`)}
    </span>
  );
}
