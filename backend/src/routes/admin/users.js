// Users management: student information, ID card review, registration approval, suspension (admins),
// and roles: who is student, admin or super admin (super admins only).
import { Router } from "express";
import { db } from "../../lib/supabase.js";
import { HttpError, assertUuid, oneOf, pageParams, runPage, searchFilter } from "../../lib/http.js";
import { logActivity, noteDetails } from "../../lib/activity.js";
import { ROLES, requireSuperAdmin } from "../../middleware/auth.js";

const router = Router();

const REGISTRATION_STATUSES = ["pending", "approved", "rejected"];
const LIST_COLUMNS = "id, full_name, email, phone, student_number, faculty, registration_status, is_suspended, role, created_at";
const STAFF_ROLES = ["admin", "super_admin"];

/** What each action changes. POST /api/admin/users/:id/<action> */
const ACTIONS = {
  approve: () => ({ registration_status: "approved" }),
  reject: () => ({ registration_status: "rejected" }),
  suspend: () => ({ is_suspended: true, suspended_at: new Date().toISOString() }),
  unsuspend: () => ({ is_suspended: false, suspended_at: null }),
};

/**
 * GET /api/admin/users?q=&status=&suspended=true|false&role=student|admin|super_admin|staff&page=
 *   role=staff → admins and super admins together
 * → { data, total, page, page_size } (newest first)
 */
router.get("/", async (req, res) => {
  const status = oneOf(req.query.status, REGISTRATION_STATUSES, "status");
  const suspended = oneOf(req.query.suspended, ["true", "false"], "suspended");
  const role = oneOf(req.query.role, [...ROLES, "staff"], "role");
  const paging = pageParams(req.query);

  let query = db.from("users").select(LIST_COLUMNS, { count: "exact" }).order("created_at", { ascending: false });
  if (status) query = query.eq("registration_status", status);
  if (suspended) query = query.eq("is_suspended", suspended === "true");
  if (role === "staff") query = query.in("role", STAFF_ROLES);
  else if (role) query = query.eq("role", role);
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

/**
 * PUT /api/admin/users/:id/role  body { role: "student" | "admin" | "super_admin", note? }  (super admin)
 * Rules: never your own role (so there is always at least one super admin: you);
 * only an approved, active account can become staff.
 */
router.put("/:id/role", requireSuperAdmin, async (req, res) => {
  assertUuid(req.params.id, "User");
  const role = oneOf(req.body?.role, ROLES, "role");
  if (!role) throw new HttpError(400, "role is required");
  if (req.params.id === req.user.id) throw new HttpError(400, "You can't change your own role");

  const { data: target, error: readError } = await db
    .from("users")
    .select("id, role, registration_status, is_suspended")
    .eq("id", req.params.id)
    .maybeSingle();
  if (readError) throw readError;
  if (!target) throw new HttpError(404, "User not found");
  if (role !== "student" && (target.registration_status !== "approved" || target.is_suspended)) {
    throw new HttpError(400, "Only an approved, active account can become admin");
  }

  const { data, error } = await db
    .from("users")
    .update({ role })
    .eq("id", target.id)
    .select(`${LIST_COLUMNS}, id_card_url, suspended_at`)
    .single();
  if (error) throw error;

  if (target.role !== role) {
    await logActivity(req, {
      action: "user.role",
      targetType: "user",
      targetId: data.id,
      targetLabel: data.full_name,
      details: { from: target.role, to: role, ...noteDetails(req.body) },
    });
  }
  res.json({ data });
});

/** POST /api/admin/users/:id/(approve|reject|suspend|unsuspend)  body { note? }  →  the updated user */
router.post("/:id/:action", async (req, res) => {
  assertUuid(req.params.id, "User");
  const changesFor = ACTIONS[req.params.action];
  if (!changesFor) throw new HttpError(404, `Unknown action: ${req.params.action}`);
  if (req.params.id === req.user.id) throw new HttpError(400, "You can't do this on your own account");

  const { data: target, error: readError } = await db.from("users").select("id, role").eq("id", req.params.id).maybeSingle();
  if (readError) throw readError;
  if (!target) throw new HttpError(404, "User not found");
  if (STAFF_ROLES.includes(target.role) && req.params.action !== "approve") {
    throw new HttpError(400, "This account is staff: a super admin must change its role to student first");
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
