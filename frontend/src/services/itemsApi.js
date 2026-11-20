import { request } from "./apiClient";

/**
 * Converts whatever the backend returns into ONE stable shape for the UI.
 * If a field is renamed in the API, only this function needs to change.
 */
export function normalizeItem(raw = {}) {
  const images = raw.images ?? raw.image_urls ?? (raw.image_url ? [raw.image_url] : []);
  return {
    id: String(raw.id ?? raw._id ?? ""),
    title: raw.title ?? "Untitled item",
    description: raw.description ?? "",
    type: (raw.type ?? raw.item_type ?? "lost").toLowerCase(), // "lost" | "found"
    category: raw.category ?? raw.category_slug ?? "other",
    location: raw.location ?? raw.location_name ?? "",
    eventDate: raw.event_date ?? raw.eventDate ?? raw.date ?? null, // date lost / found
    createdAt: raw.created_at ?? raw.createdAt ?? null, // publication date
    images: Array.isArray(images) ? images.filter(Boolean) : [],
    moderationStatus: raw.moderation_status ?? raw.status ?? "approved",
    isActive: raw.is_active ?? raw.isActive ?? true,
    publisher: {
      name: raw.publisher?.name ?? raw.publisher_name ?? "FindIt user",
      email: raw.publisher?.email ?? raw.publisher_email ?? null,
      phone: raw.publisher?.phone ?? raw.publisher_phone ?? null,
    },
  };
}

/** Only approved + active publications are public. */
export const isPublic = (item) => item.moderationStatus === "approved" && item.isActive !== false;

/**
 * GET /items?q=&category=&type=&limit=   (the API returns approved + active items only, newest first)
 * `lang` is sent as Accept-Language; items are shown as their publisher wrote them.
 */
export async function getItems({ q, category, type, limit = 8, signal, lang } = {}) {
  const params = new URLSearchParams({ limit });
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (type) params.set("type", type);

  const json = await request(`/items?${params}`, { signal, lang });
  const list = Array.isArray(json) ? json : json.data ?? [];
  // Safety net: never show unapproved items even if the API forgets to filter.
  return list.map(normalizeItem).filter(isPublic);
}

/** GET /items/:id   →  { data: Item } */
export async function getItemById(id, { signal, lang } = {}) {
  const json = await request(`/items/${encodeURIComponent(id)}`, { signal, lang });
  const item = normalizeItem(json.data ?? json);
  if (!isPublic(item)) {
    const error = new Error("This publication is not available");
    error.status = 404;
    throw error;
  }
  return item;
}
