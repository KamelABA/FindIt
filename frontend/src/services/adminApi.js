import { request } from "./apiClient";
import { normalizeItem } from "./itemsApi";

/**
 * Admin API (backend: /api/admin/*).
 *
 * TEMPORARY sign-in, until login / password exist: the admin's email is kept in localStorage
 * and sent in the X-User-Email header. The backend lets the request through only if that account
 * has is_admin = true in the database. When real login exists, replace adminHeaders() with the
 * session token and remove the email form in pages/admin/AccessForm.jsx.
 */
const EMAIL_KEY = "findit-admin-email";

export function getAdminEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

export function setAdminEmail(email) {
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email);
    else localStorage.removeItem(EMAIL_KEY);
  } catch {
    // storage blocked: the dashboard asks again next visit
  }
}

// Called when the server refuses the admin (401 / 403), e.g. is_admin was switched off in the database
let deniedHandler = null;
export function onAdminDenied(handler) {
  deniedHandler = handler;
  return () => {
    if (deniedHandler === handler) deniedHandler = null;
  };
}

async function admin(path, { email, ...options } = {}) {
  try {
    return await request(`/admin${path}`, { ...options, headers: { "X-User-Email": email ?? getAdminEmail() } });
  } catch (error) {
    if (!email && (error.status === 401 || error.status === 403)) deniedHandler?.(error);
    throw error;
  }
}

const query = (params) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
};

/** { data, total, page, page_size } → { rows, total, page, pageSize } */
const toPage = (json, map = (x) => x) => ({
  rows: json.data.map(map),
  total: json.total,
  page: json.page,
  pageSize: json.page_size,
});

/* ── Session ─────────────────────────────────────────────────────────────── */

/** Checks an email: resolves with the admin account, rejects with status 401 / 403 / 503. */
export const getMe = (email, { signal } = {}) => admin("/me", { email, signal }).then((r) => r.data);

/* ── Statistics ──────────────────────────────────────────────────────────── */

/** { since, weeks, totals, period: { items, claims, users, recovered, by_category[], weekly[] } } */
export const getStats = ({ weeks = 12, signal } = {}) => admin(`/stats${query({ weeks })}`, { signal }).then((r) => r.data);

/* ── Publications ────────────────────────────────────────────────────────── */

/** Public item shape + the admin-only fields */
export const adminItem = (raw) => ({
  ...normalizeItem(raw),
  lifecycleStatus: raw.lifecycle_status ?? "open",
  resolvedAt: raw.resolved_at ?? null,
  archivedAt: raw.archived_at ?? null,
  updatedAt: raw.updated_at ?? null,
  publisherId: raw.publisher?.id ?? null,
  claims: raw.claims ?? [],
});

/** params: { type, status, lifecycle, category, q, page, page_size } */
export const listItems = (params = {}, { signal } = {}) =>
  admin(`/items${query(params)}`, { signal }).then((json) => toPage(json, adminItem));

export const getItem = (id, { signal } = {}) => admin(`/items/${encodeURIComponent(id)}`, { signal }).then((r) => adminItem(r.data));

/** changes: { title?, description?, type?, category?, location?, event_date? } */
export const editItem = (id, changes) =>
  admin(`/items/${encodeURIComponent(id)}`, { method: "PATCH", body: changes }).then((r) => adminItem(r.data));

/** action: "approve" | "reject" | "resolve" | "archive" | "reopen" */
export const itemAction = (id, action, note) =>
  admin(`/items/${encodeURIComponent(id)}/${action}`, { method: "POST", body: { note } }).then((r) => adminItem(r.data));

export const deleteItem = (id, note) => admin(`/items/${encodeURIComponent(id)}`, { method: "DELETE", body: { note } });

/** Archives open publications older than `days` days → { archived: n } */
export const archiveOldItems = (days = 30) => admin("/items/archive-old", { method: "POST", body: { days } }).then((r) => r.data);

/* ── Claims ──────────────────────────────────────────────────────────────── */

/** params: { status, q, page } */
export const listClaims = (params = {}, { signal } = {}) => admin(`/claims${query(params)}`, { signal }).then((json) => toPage(json));

export const getClaim = (id, { signal } = {}) => admin(`/claims/${encodeURIComponent(id)}`, { signal }).then((r) => r.data);

/** action: "approve" | "reject" | "complete" | "reopen" */
export const claimAction = (id, action, note) =>
  admin(`/claims/${encodeURIComponent(id)}/${action}`, { method: "POST", body: { note } }).then((r) => r.data);

/* ── Users ───────────────────────────────────────────────────────────────── */

/** params: { q, status, suspended, role, page } */
export const listUsers = (params = {}, { signal } = {}) => admin(`/users${query(params)}`, { signal }).then((json) => toPage(json));

export const getUser = (id, { signal } = {}) => admin(`/users/${encodeURIComponent(id)}`, { signal }).then((r) => r.data);

/** action: "approve" | "reject" | "suspend" | "unsuspend" */
export const userAction = (id, action, note) =>
  admin(`/users/${encodeURIComponent(id)}/${action}`, { method: "POST", body: { note } }).then((r) => r.data);

/* ── Activity logs ───────────────────────────────────────────────────────── */

/** params: { action, admin_id, q, page } */
export const listLogs = (params = {}, { signal } = {}) => admin(`/logs${query(params)}`, { signal }).then((json) => toPage(json));
