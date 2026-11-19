// Date helpers. `locale` comes from useI18n().dateLocale ("en-GB" or "ar-DZ").

export function formatDate(value, locale = "en-GB") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

/** "2 days ago" / "قبل يومين", in the language of `locale` */
export function timeAgo(value, locale = "en-GB") {
  if (!value) return "";
  const seconds = (new Date(value).getTime() - Date.now()) / 1000; // negative = in the past
  if (Number.isNaN(seconds)) return "";
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(0, "minute"); // "this minute"
}
