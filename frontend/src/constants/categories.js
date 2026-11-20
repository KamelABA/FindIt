// The 7 FindIt categories. `icon` is a name from components/Icon.jsx (render with <Icon name={c.icon} />).
// `slug` must match the value stored in the database
// (agree on these slugs with Chaima & Asma).
//
// Texts are translated: use categoryLabel(t, slug) / categoryDescription(t, slug),
// with `t` from useI18n(). The English `label` / `description` below are only a fallback.
export const CATEGORIES = [
  { slug: "electronics", label: "Electronics", icon: "electronics", description: "Phones, laptops, chargers, earbuds" },
  { slug: "personal", label: "Personal Items", icon: "personal", description: "Wallets, keys, bags, glasses" },
  { slug: "documents", label: "Documents", icon: "documents", description: "Student cards, IDs, papers" },
  { slug: "clothing", label: "Clothing", icon: "clothing", description: "Jackets, scarves, caps" },
  { slug: "university", label: "University Items", icon: "university", description: "Books, notebooks, USB keys" },
  { slug: "accessories", label: "Accessories", icon: "accessories", description: "Watches, jewelry, bottles" },
  { slug: "other", label: "Other", icon: "other", description: "Anything else" },
];

const KNOWN = new Set(CATEGORIES.map((c) => c.slug));

export const getCategory = (slug) =>
  CATEGORIES.find((c) => c.slug === slug) || { slug, label: slug || "Other", icon: "other" };

/** Translated name; an unknown slug coming from the API is shown as it is. */
export const categoryLabel = (t, slug) => (KNOWN.has(slug) ? t(`categories.${slug}.label`) : slug || t("categories.other.label"));
export const categoryDescription = (t, slug) => (KNOWN.has(slug) ? t(`categories.${slug}.description`) : "");

// Publication type (lost / found). Label: t(`types.${type}`)
export const ITEM_TYPES = {
  lost: { label: "Lost", className: "bg-brand-100 text-lost ring-lost/25", disc: "bg-brand-500 text-white" },
  found: { label: "Found", className: "bg-found/15 text-found ring-found/25", disc: "bg-found text-white dark:text-coal-900" },
};
