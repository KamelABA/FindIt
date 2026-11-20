// Activity logs: who did what, and when (read-only).
import { Router } from "express";
import { db } from "../../lib/supabase.js";
import { HttpError, assertUuid, pageParams, runPage, searchFilter } from "../../lib/http.js";

const router = Router();

/**
 * GET /api/admin/logs?action=&admin_id=&q=&page=&page_size=
 *   action: a full action ("item.approve") or a group ("item", "claim", "user", "items")
 * → { data, total, page, page_size } (newest first)
 */
router.get("/", async (req, res) => {
  const paging = pageParams(req.query, { size: 25 });

  let query = db
    .from("activity_logs")
    .select("id, action, target_type, target_id, target_label, details, created_at, admin:users ( id, full_name, email )", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  const action = String(req.query.action ?? "").trim();
  if (action) {
    if (!/^[a-z_]+(\.[a-z_]+)?$/.test(action)) throw new HttpError(400, "Invalid action filter");
    query = action.includes(".") ? query.eq("action", action) : query.like("action", `${action}.%`);
  }
  if (req.query.admin_id) {
    assertUuid(req.query.admin_id, "Admin");
    query = query.eq("admin_id", req.query.admin_id);
  }
  const search = searchFilter(req.query.q, ["target_label"]);
  if (search) query = query.or(search);

  res.json(await runPage(query, paging));
});

export default router;
