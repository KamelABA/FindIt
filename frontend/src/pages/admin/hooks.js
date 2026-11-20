// Helpers shared by the admin pages.
import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * List filters kept in the URL (?q=&status=&page=&open=), so a filtered view survives a refresh
 * and can be linked to (e.g. from the overview: /admin/lost?status=pending&open=<id>).
 *
 *   const [list, setParam, clearFilters, filtered] = useListParams(["q", "status"]);
 *   list.q, list.status, list.page, list.open
 *
 * Changing a filter goes back to page 1. `open` = id of the record shown in the drawer.
 */
export function useListParams(keys) {
  const [params, setParams] = useSearchParams();
  const keyList = keys.join(",");

  const values = useMemo(() => {
    const out = { page: Math.max(1, Number(params.get("page")) || 1), open: params.get("open") || "" };
    for (const key of keyList.split(",")) out[key] = params.get(key) || "";
    return out;
  }, [params, keyList]);

  const setParam = useCallback(
    (key, value) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === "" || value == null || (key === "page" && Number(value) === 1)) next.delete(key);
          else next.set(key, String(value));
          if (key !== "page" && key !== "open") next.delete("page");
          return next;
        },
        { replace: key === "page" ? false : true }
      );
    },
    [setParams]
  );

  const clearFilters = useCallback(() => setParams({}, { replace: true }), [setParams]);
  const filtered = keyList.split(",").some((key) => values[key]);

  return [values, setParam, clearFilters, filtered];
}

/**
 * Runs an admin action (approve, suspend…): tracks busy / error, then calls onDone(result).
 *   const action = useAction(() => { reload(); refreshCounts(); });
 *   action.run(() => itemAction(id, "approve"))
 */
export function useAction(onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const done = useRef(onDone);
  done.current = onDone;

  const run = useCallback(async (fn) => {
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      done.current?.(result);
      return result;
    } catch (err) {
      setError(err);
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  return { run, busy, error, clearError: useCallback(() => setError(null), []) };
}

/** "20 Nov 2026, 14:05" in the interface language */
export function formatDateTime(value, locale = "en-GB") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** "16 Nov" – short label for a week start on chart axes */
export function formatWeek(value, locale = "en-GB") {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}
