import { API_URL } from "../config/env";

/**
 * fetch() wrapper for the FindIt backend.
 * - `lang` ("en" | "ar") is sent as Accept-Language
 * - errors carry `status` (HTTP) or `code: "network"`; the UI translates them (errorText in lib/i18n.jsx)
 * - the server's `{ error }` message is kept as `error.message`
 */
export async function request(path, { method = "GET", body, headers = {}, signal, lang } = {}) {
  const allHeaders = { Accept: "application/json", ...headers };
  if (lang) allHeaders["Accept-Language"] = lang;
  if (body !== undefined) allHeaders["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: allHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    if (cause.name === "AbortError") throw cause; // request cancelled on unmount / change
    // Network failure (server down, offline, CORS): show a readable message instead of "Failed to fetch"
    const error = new Error("Can’t reach the server. Check your connection and try again.", { cause });
    error.code = "network";
    throw error;
  }

  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(json?.error || (res.status === 404 ? "Not found" : `Server error (${res.status})`));
    error.status = res.status;
    throw error;
  }
  return json;
}
