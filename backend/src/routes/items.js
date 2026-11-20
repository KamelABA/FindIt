// Public items API: only approved, active and open (not resolved / archived) publications are returned.
import { Router } from "express";
import { db } from "../lib/supabase.js";
import { HttpError, assertUuid, intParam, oneOf, searchFilter } from "../lib/http.js";
import { ITEM_COLUMNS, ITEM_TYPES, toItem } from "../lib/items.js";
import { getSettings } from "../lib/settings.js";

const router = Router();

/** Public shape: no internal ids; email / phone only when the show_publisher_contact setting allows it. */
function publicItem(row, showContact) {
  const item = toItem(row);
  const publisher = item.publisher;
  item.publisher = publisher
    ? { name: publisher.name, email: showContact ? publisher.email : null, phone: showContact ? publisher.phone : null }
    : null;
  return item;
}

/** GET /api/items?q=&category=&type=lost|found&limit=20  →  { data: Item[] } (newest first) */
router.get("/", async (req, res) => {
  const type = oneOf(req.query.type, ITEM_TYPES, "type");
  const limit = intParam(req.query.limit, { min: 1, max: 100, fallback: 20 });

  let query = db
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("moderation_status", "approved")
    .eq("is_active", true)
    .eq("lifecycle_status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) query = query.eq("type", type);
  if (req.query.category) query = query.eq("category", String(req.query.category));
  const search = searchFilter(req.query.q, ["title", "description", "location"]);
  if (search) query = query.or(search);

  const [{ data, error }, settings] = await Promise.all([query, getSettings()]);
  if (error) throw error;
  res.json({ data: data.map((row) => publicItem(row, settings.show_publisher_contact)) });
});

/** GET /api/items/:id  →  { data: Item }, 404 if missing, not approved, hidden, resolved or archived */
router.get("/:id", async (req, res) => {
  assertUuid(req.params.id);
  const { data, error } = await db
    .from("items")
    .select(ITEM_COLUMNS)
    .eq("id", req.params.id)
    .eq("moderation_status", "approved")
    .eq("is_active", true)
    .eq("lifecycle_status", "open")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Item not found");
  const { show_publisher_contact } = await getSettings();
  res.json({ data: publicItem(data, show_publisher_contact) });
});

export default router;
