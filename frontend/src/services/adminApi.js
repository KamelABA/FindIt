import { request } from "./apiClient";
import { normalizeItem } from "./itemsApi";

/**
 * Admin API (backend: /api/admin/*).
 *
 * TEMPORARY sign-in, until login / password exist: the admin's email is kept in localStorage
 * and sent in the X-User-Email header. The backend lets the request through only if that account
 * has role = admin or super_admin in the database. When real login exists, replace adminHeaders() with the
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

// Called when the server refuses the admin (401 / 403), e.g. the role was changed to student
let deniedHandler = null;
export function onAdminDenied(handler) {
  deniedHandler = handler;
  return () => {
    if (deniedHandler === handler) deniedHandler = null;
  };
}

// Server answers that mean "you are not (or no longer) an admin": sign out.
// Not "super_admin_required": an admin simply can't do that one thing.
const SIGN_OUT_CODES = new Set(["sign_in_required", "no_account", "not_admin", "suspended"]);

async function admin(path, { email, ...options } = {}) {
  try {
    return await request(`/admin${path}`, { ...options, headers: { "X-User-Email": email ?? getAdminEmail() } });
  } catch (error) {
    if (!email && SIGN_OUT_CODES.has(error.code)) deniedHandler?.(error);
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

/** Archives open publications older than the archive_after_days setting → { archived: n, days } */
export const archiveOldItems = () => admin("/items/archive-old", { method: "POST", body: {} }).then((r) => r.data);

/* ── Claims ──────────────────────────────────────────────────────────────── */

/** params: { status, q, page } */
export const listClaims = (params = {}, { signal } = {}) => admin(`/claims${query(params)}`, { signal }).then((json) => toPage(json));

export const getClaim = (id, { signal } = {}) => admin(`/claims/${encodeURIComponent(id)}`, { signal }).then((r) => r.data);

/** action: "approve" | "reject" | "complete" | "reopen" */
export const claimAction = (id, action, note) =>
  admin(`/claims/${encodeURIComponent(id)}/${action}`, { method: "POST", body: { note } }).then((r) => r.data);

/* ── Users ───────────────────────────────────────────────────────────────── */

/** Super admin: role = "student" | "admin" | "super_admin" */
export const setUserRole = (id, role, note) =>
  admin(`/users/${encodeURIComponent(id)}/role`, { method: "PUT", body: { role, note } }).then((r) => r.data);

/** params: { q, status, suspended, role: student|admin|super_admin|staff, page } */
export const listUsers = (params = {}, { signal } = {}) => admin(`/users${query(params)}`, { signal }).then((json) => toPage(json));

export const getUser = (id, { signal } = {}) => admin(`/users/${encodeURIComponent(id)}`, { signal }).then((r) => r.data);

/** action: "approve" | "reject" | "suspend" | "unsuspend" */
export const userAction = (id, action, note) =>
  admin(`/users/${encodeURIComponent(id)}/${action}`, { method: "POST", body: { note } }).then((r) => r.data);

/* ── System settings ─────────────────────────────────────────────────────── */

/** [{ key, value, updated_at, updated_by }] → { values: { key: value }, list } */
const toSettings = (r) => ({ values: Object.fromEntries(r.data.map((s) => [s.key, s.value])), list: r.data });

export const getSettings = ({ signal } = {}) => admin("/settings", { signal }).then(toSettings);

/** Super admin: changes = { archive_after_days?, show_publisher_contact? } */
export const updateSettings = (changes) => admin("/settings", { method: "PATCH", body: changes }).then(toSettings);

/* ── Activity logs ───────────────────────────────────────────────────────── */

/** params: { action, admin_id, q, page } */
export const listLogs = (params = {}, { signal } = {}) => admin(`/logs${query(params)}`, { signal }).then((json) => toPage(json));
