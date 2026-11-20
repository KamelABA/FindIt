import { Router } from "express";
import { db } from "../../lib/supabase.js";
import { intParam } from "../../lib/http.js";

const router = Router();

/**
 * GET /api/admin/stats?weeks=12
 * → { data: { since, weeks, totals: {...all time}, period: {...last `weeks` weeks, weekly[], by_category[]} } }
 * Computed in the database by the admin_stats() function (supabase/schema.sql).
 */
router.get("/", async (req, res) => {
  const weeks = intParam(req.query.weeks, { min: 1, max: 104, fallback: 12 });
  const { data, error } = await db.rpc("admin_stats", { p_weeks: weeks });
  if (error) throw error;
  res.json({ data });
});

export default router;
