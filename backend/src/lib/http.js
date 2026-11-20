// Small helpers shared by the routes.

/**
 * Throw one of these from a route: the error handler answers { error: message, code? } with its status.
 * `code` lets the frontend tell cases apart (e.g. "not_admin" signs out, "super_admin_required" doesn't).
 */
export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids are UUIDs: anything else can't exist, answer 404 without asking the database. */
export function assertUuid(id, what = "Item") {
  if (!UUID.test(String(id))) throw new HttpError(404, `${what} not found`);
}

/** Integer query param, clamped to [min, max]. */
export function intParam(value, { min, max, fallback }) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Value must be one of `allowed` (or empty). */
export function oneOf(value, allowed, name) {
  if (value === undefined || value === null || value === "") return undefined;
  if (!allowed.includes(value)) throw new HttpError(400, `${name} must be one of: ${allowed.join(", ")}`);
  return value;
}

/** Optional text field from a request body: trimmed, length-checked. */
export function textField(value, name, { max, required = false }) {
  if (value === undefined) return undefined;
  if (value !== null && typeof value !== "string") throw new HttpError(400, `${name} must be text`);
  const text = (value ?? "").trim();
  if (required && !text) throw new HttpError(400, `${name} is required`);
  if (text.length > max) throw new HttpError(400, `${name} is too long (max ${max} characters)`);
  return text;
}

/**
 * Keyword search on several columns (PostgREST `or` filter).
 * Characters that have a meaning in the filter syntax are removed from the user's text.
 */
export function searchFilter(q, columns) {
  const term = String(q ?? "")
    .replace(/[%_*,()"\\.:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  if (!term) return null;
  return columns.map((column) => `${column}.ilike.%${term}%`).join(",");
}

/** ?page=1&page_size=20 → { page, pageSize, from, to } for query.range(from, to) */
export function pageParams(query, { size = 20, max = 100 } = {}) {
  const page = intParam(query.page, { min: 1, max: 100000, fallback: 1 });
  const pageSize = intParam(query.page_size, { min: 1, max, fallback: size });
  const from = (page - 1) * pageSize;
  return { page, pageSize, from, to: from + pageSize - 1 };
}

/**
 * Runs a list query built with { count: "exact" } on one page.
 * Answers { data, total, page, page_size }; a page past the end is simply empty.
 */
export async function runPage(query, paging) {
  const { data, count, error } = await query.range(paging.from, paging.to);
  if (error?.code === "PGRST103") return { data: [], total: count ?? 0, page: paging.page, page_size: paging.pageSize };
  if (error) throw error;
  return { data, total: count ?? 0, page: paging.page, page_size: paging.pageSize };
}
