// Users management: student information, ID card review, registration approval, suspension.
// Admin rights (is_admin) are NOT changed here: they are managed in the database.
import { Router } from "express";
import { db } from "../../lib/supabase.js";
import { HttpError, assertUuid, oneOf, pageParams, runPage, searchFilter } from "../../lib/http.js";
import { logActivity, noteDetails } from "../../lib/activity.js";

const router = Router();

const REGISTRATION_STATUSES = ["pending", "approved", "rejected"];
const LIST_COLUMNS = "id, full_name, email, phone, student_number, faculty, registration_status, is_suspended, is_admin, created_at";

/** What each action changes. POST /api/admin/users/:id/<action> */
const ACTIONS = {
  approve: () => ({ registration_status: "approved" }),
  reject: () => ({ registration_status: "rejected" }),
  suspend: () => ({ is_suspended: true, suspended_at: new Date().toISOString() }),
  unsuspend: () => ({ is_suspended: false, suspended_at: null }),
};

/**
 * GET /api/admin/users?q=&status=&suspended=true|false&role=admin|student&page=
 * → { data, total, page, page_size } (newest first)
 */
router.get("/", async (req, res) => {
  const status = oneOf(req.query.status, REGISTRATION_STATUSES, "status");
  const suspended = oneOf(req.query.suspended, ["true", "false"], "suspended");
  const role = oneOf(req.query.role, ["admin", "student"], "role");
  const paging = pageParams(req.query);

  let query = db.from("users").select(LIST_COLUMNS, { count: "exact" }).order("created_at", { ascending: false });
  if (status) query = query.eq("registration_status", status);
  if (suspended) query = query.eq("is_suspended", suspended === "true");
  if (role) query = query.eq("is_admin", role === "admin");
  const search = searchFilter(req.query.q, ["full_name", "email", "student_number", "faculty"]);
  if (search) query = query.or(search);

  res.json(await runPage(query, paging));
});

/** GET /api/admin/users/:id  →  the user, its ID card, counters and latest publications */
router.get("/:id", async (req, res) => {
  assertUuid(req.params.id, "User");
  const id = req.params.id;

  const [user, items, itemCount, claimCount] = await Promise.all([
    db.from("users").select(`${LIST_COLUMNS}, id_card_url, suspended_at`).eq("id", id).maybeSingle(),
    db
      .from("items")
      .select("id, title, type, moderation_status, lifecycle_status, created_at")
      .eq("publisher_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    db.from("items").select("*", { count: "exact", head: true }).eq("publisher_id", id),
    db.from("claims").select("*", { count: "exact", head: true }).eq("claimant_id", id),
  ]);
  for (const result of [user, items, itemCount, claimCount]) if (result.error) throw result.error;
  if (!user.data) throw new HttpError(404, "User not found");

  res.json({
    data: {
      ...user.data,
      recent_items: items.data,
      counts: { items: itemCount.count ?? 0, claims: claimCount.count ?? 0 },
    },
  });
});

/** POST /api/admin/users/:id/(approve|reject|suspend|unsuspend)  body { note? }  →  the updated user */
router.post("/:id/:action", async (req, res) => {
  assertUuid(req.params.id, "User");
  const changesFor = ACTIONS[req.params.action];
  if (!changesFor) throw new HttpError(404, `Unknown action: ${req.params.action}`);
  if (req.params.id === req.user.id) throw new HttpError(400, "You can't do this on your own account");

  const { data: target, error: readError } = await db.from("users").select("id, is_admin").eq("id", req.params.id).maybeSingle();
  if (readError) throw readError;
  if (!target) throw new HttpError(404, "User not found");
  if (target.is_admin && req.params.action !== "approve") {
    throw new HttpError(400, "This account is an admin: remove its admin rights in the database first");
  }

  const { data, error } = await db
    .from("users")
    .update(changesFor())
    .eq("id", req.params.id)
    .select(`${LIST_COLUMNS}, id_card_url, suspended_at`)
    .single();
  if (error) throw error;

  await logActivity(req, {
    action: `user.${req.params.action}`,
    targetType: "user",
    targetId: data.id,
    targetLabel: data.full_name,
    details: noteDetails(req.body),
  });
  res.json({ data });
});

export default router;
