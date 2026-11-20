import { Router } from "express";
import { db } from "../lib/supabase.js";

const router = Router();

/** GET /api/categories  →  { data: [{ slug, name_en, name_ar, sort_order }] } */
router.get("/", async (_req, res) => {
  const { data, error } = await db.from("categories").select("slug, name_en, name_ar, sort_order").order("sort_order");
  if (error) throw error;
  res.json({ data });
});

export default router;
