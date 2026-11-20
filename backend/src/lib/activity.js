import { db } from "./supabase.js";

/**
 * Records an admin action in `activity_logs`.
 * Called after the action succeeded: if the log itself fails, the action is not undone,
 * the failure is reported in the server console.
 *
 *   action       "item.approve", "claim.complete", "user.suspend"…
 *   targetType   "item" | "claim" | "user"
 *   targetLabel  readable name at the time of the action (title, person…)
 *   details      extra JSON (reason, changed fields, counts…)
 */
export async function logActivity(req, { action, targetType, targetId = null, targetLabel = "", details = {} }) {
  const { error } = await db.from("activity_logs").insert({
    admin_id: req.user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    target_label: targetLabel ?? "",
    details,
  });
  if (error) console.error(`Could not write the activity log (${action})`, error);
}

/** Optional reason sent with an action ({ note }) → details object */
export function noteDetails(body) {
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";
  return note ? { note } : {};
}
