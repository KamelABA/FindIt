// Claims management: review ownership requests, approve / reject, mark recoveries completed.
import { Router } from "express";
import { db } from "../../lib/supabase.js";
import { HttpError, assertUuid, oneOf, pageParams, runPage, searchFilter } from "../../lib/http.js";
import { logActivity, noteDetails } from "../../lib/activity.js";

const router = Router();

const CLAIM_STATUSES = ["pending", "approved", "rejected", "completed"];

const CLAIM_COLUMNS = `
  id, message, evidence_urls, status, created_at, updated_at, completed_at,
  item:items ( id, title, type, category, location, images, moderation_status, lifecycle_status ),
  claimant:users ( id, full_name, email, phone, student_number, faculty, registration_status, is_suspended )
`;

/**
 * Allowed moves. `from`: statuses the claim may be in; `to`: new status.
 * complete = the item was handed back: the claim is completed and the item resolved.
 */
const ACTIONS = {
  approve: { from: ["pending", "rejected"], to: "approved" },
  reject: { from: ["pending", "approved"], to: "rejected" },
  complete: { from: ["approved"], to: "completed" },
  reopen: { from: ["approved", "rejected", "completed"], to: "pending" },
};

/** GET /api/admin/claims?status=&q=&page=  →  { data, total, page, page_size } (newest first) */
router.get("/", async (req, res) => {
  const status = oneOf(req.query.status, CLAIM_STATUSES, "status");
  const paging = pageParams(req.query);

  let query = db.from("claims").select(CLAIM_COLUMNS, { count: "exact" }).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const search = searchFilter(req.query.q, ["message"]);
  if (search) query = query.or(search);

  res.json(await runPage(query, paging));
});

/** GET /api/admin/claims/:id */
router.get("/:id", async (req, res) => {
  assertUuid(req.params.id, "Claim");
  const { data, error } = await db.from("claims").select(CLAIM_COLUMNS).eq("id", req.params.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Claim not found");
  res.json({ data });
});

/** POST /api/admin/claims/:id/(approve|reject|complete|reopen)  body { note? }  →  the updated claim */
router.post("/:id/:action", async (req, res) => {
  assertUuid(req.params.id, "Claim");
  const action = ACTIONS[req.params.action];
  if (!action) throw new HttpError(404, `Unknown action: ${req.params.action}`);

  const { data: current, error: readError } = await db
    .from("claims")
    .select("id, status, item:items ( id, title )")
    .eq("id", req.params.id)
    .maybeSingle();
  if (readError) throw readError;
  if (!current) throw new HttpError(404, "Claim not found");
  if (!action.from.includes(current.status)) {
    throw new HttpError(409, `A ${current.status} claim can't be moved to ${action.to}`);
  }

  const changes = { status: action.to, completed_at: action.to === "completed" ? new Date().toISOString() : null };
  const { data, error } = await db
    .from("claims")
    .update(changes)
    .eq("id", current.id)
    .eq("status", current.status) // nobody changed it meanwhile
    .select(CLAIM_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(409, "This claim was changed meanwhile, reload and try again");

  // A completed recovery closes the publication
  if (action.to === "completed" && current.item) {
    const { error: itemError } = await db
      .from("items")
      .update({ lifecycle_status: "resolved", resolved_at: changes.completed_at, archived_at: null })
      .eq("id", current.item.id);
    if (itemError) throw itemError;
    data.item.lifecycle_status = "resolved";
  }

  await logActivity(req, {
    action: `claim.${req.params.action}`,
    targetType: "claim",
    targetId: data.id,
    targetLabel: current.item?.title ?? "",
    details: { item_id: current.item?.id ?? null, claimant: data.claimant?.full_name ?? null, ...noteDetails(req.body) },
  });
  res.json({ data });
});

export default router;
