import { API_URL, USE_MOCK } from "../config/env";
import { MOCK_ITEMS } from "../data/mockItems";

/**
 * Converts whatever the backend returns into ONE stable shape for the UI.
 * If Chaima / Asma rename a field, only this function needs to change.
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
 * `lang` ("en" | "ar") is the language of the interface.
 * - Real API: sent as the `Accept-Language` header, in case the backend ever returns translated text.
 *   Today the items are shown as their publisher wrote them.
 * - Mock data: every mock item has an `ar` block, used when the interface is in Arabic.
 */
async function request(path, { signal, lang } = {}) {
  const headers = { Accept: "application/json" };
  if (lang) headers["Accept-Language"] = lang;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { signal, headers });
  } catch (cause) {
    if (cause.name === "AbortError") throw cause; // request cancelled on unmount / change
    // Network failure (server down, offline, CORS): show a readable message instead of "Failed to fetch"
    const error = new Error("Can’t reach the server. Check your connection and try again.", { cause });
    error.code = "network"; // the UI translates by code / status (see errorText in lib/i18n.jsx)
    throw error;
  }
  if (!res.ok) {
    const error = new Error(res.status === 404 ? "Item not found" : `Server error (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Mock only: swap in the Arabic title / description / location / publisher name. */
function localizeMock(raw, lang) {
  const text = lang === "ar" ? raw.ar : null;
  if (!text) return raw;
  return {
    ...raw,
    title: text.title ?? raw.title,
    description: text.description ?? raw.description,
    location: text.location ?? raw.location,
    publisher: { ...raw.publisher, name: text.publisher ?? raw.publisher?.name },
  };
}

const mockItems = (lang) => MOCK_ITEMS.map((raw) => normalizeItem(localizeMock(raw, lang)));

function filterMock({ q, category, type, lang }) {
  const term = (q || "").trim().toLowerCase();
  return mockItems(lang)
    .filter(isPublic)
    .filter((i) => !category || i.category === category)
    .filter((i) => !type || i.type === type)
    .filter(
      (i) =>
        !term ||
        [i.title, i.description, i.location].some((f) => f.toLowerCase().includes(term))
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * GET /items?status=approved&active=true&q=&category=&type=&limit=&sort=-created_at
 * Expected response: { data: Item[] }  or  Item[]
 */
export async function getItems({ q, category, type, limit = 8, signal, lang } = {}) {
  if (USE_MOCK) {
    await delay(200);
    return filterMock({ q, category, type, lang }).slice(0, limit);
  }
  const params = new URLSearchParams({ status: "approved", active: "true", sort: "-created_at", limit });
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (type) params.set("type", type);

  const json = await request(`/items?${params}`, { signal, lang });
  const list = Array.isArray(json) ? json : json.data ?? [];
  // Safety net: never show unapproved items even if the API forgets to filter.
  return list.map(normalizeItem).filter(isPublic);
}

/** GET /items/:id   Expected response: { data: Item } or Item */
export async function getItemById(id, { signal, lang } = {}) {
  if (USE_MOCK) {
    await delay(150);
    const found = mockItems(lang).find((i) => i.id === String(id));
    if (!found || !isPublic(found)) {
      const error = new Error("Item not found");
      error.status = 404;
      throw error;
    }
    return found;
  }
  const json = await request(`/items/${encodeURIComponent(id)}`, { signal, lang });
  const item = normalizeItem(json.data ?? json);
  if (!isPublic(item)) {
    const error = new Error("This publication is not available");
    error.status = 404;
    throw error;
  }
  return item;
}
