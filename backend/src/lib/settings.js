// System settings stored in the `settings` table, changed by super admins.
// Only the keys defined here exist: each one is used by the code and validated before saving.
import { db } from "./supabase.js";
import { HttpError } from "./http.js";

export const SETTINGS = {
  /** "Archive old publications" closes open posts older than this many days. */
  archive_after_days: {
    default: 30,
    parse(value) {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 3650) throw new HttpError(400, "archive_after_days must be a whole number between 1 and 3650");
      return n;
    },
  },
  /** false = the public API hides publishers' email and phone (privacy). */
  show_publisher_contact: {
    default: true,
    parse(value) {
      if (typeof value !== "boolean") throw new HttpError(400, "show_publisher_contact must be true or false");
      return value;
    },
  },
};

const CACHE_MS = 30_000; // public pages read settings on every request: keep them for 30 s
let cache = null;
let cachedAt = 0;

/** Current values (defaults for any key missing in the table). */
export async function getSettings() {
  if (cache && Date.now() - cachedAt < CACHE_MS) return cache;
  const { data, error } = await db.from("settings").select("key, value");
  if (error) throw error;

  const values = Object.fromEntries(Object.entries(SETTINGS).map(([key, def]) => [key, def.default]));
  for (const row of data) if (row.key in SETTINGS) values[row.key] = row.value;
  cache = values;
  cachedAt = Date.now();
  return values;
}

/** Settings with their last change, for the settings page. */
export async function getSettingsDetails() {
  const { data, error } = await db
    .from("settings")
    .select("key, updated_at, updated_by:users ( full_name )");
  if (error) throw error;
  const values = await getSettings();
  return Object.keys(SETTINGS).map((key) => {
    const row = data.find((r) => r.key === key);
    return { key, value: values[key], updated_at: row?.updated_at ?? null, updated_by: row?.updated_by?.full_name ?? null };
  });
}

/** Validates and saves { key: value } changes. Returns only the values that really changed. */
export async function updateSettings(changes, userId) {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) throw new HttpError(400, "Send an object { key: value }");
  const keys = Object.keys(changes);
  if (!keys.length) throw new HttpError(400, "Nothing to update");

  const current = await getSettings();
  const changed = {};
  for (const key of keys) {
    if (!(key in SETTINGS)) throw new HttpError(400, `Unknown setting: ${key}`);
    const value = SETTINGS[key].parse(changes[key]);
    if (value !== current[key]) changed[key] = value;
  }
  if (!Object.keys(changed).length) return changed;

  const now = new Date().toISOString();
  const { error } = await db
    .from("settings")
    .upsert(Object.entries(changed).map(([key, value]) => ({ key, value, updated_at: now, updated_by: userId })));
  if (error) throw error;
  cache = null; // next read gets the new values
  return changed;
}
