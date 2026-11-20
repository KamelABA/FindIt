// Publications management: review, edit, resolve, archive, delete.
import { Router } from "express";
import { db } from "../../lib/supabase.js";
import { HttpError, assertUuid, intParam, oneOf, pageParams, runPage, searchFilter, textField } from "../../lib/http.js";
import { ITEM_COLUMNS, ITEM_TYPES, LIFECYCLE_STATUSES, MODERATION_STATUSES, toItem } from "../../lib/items.js";
import { logActivity, noteDetails } from "../../lib/activity.js";
import { getSettings } from "../../lib/settings.js";

const router = Router();

const now = () => new Date().toISOString();

/** What each action changes. POST /api/admin/items/:id/<action> */
const ACTIONS = {
  approve: () => ({ moderation_status: "approved" }),
  reject: () => ({ moderation_status: "rejected" }),
  resolve: () => ({ lifecycle_status: "resolved", resolved_at: now(), archived_at: null }),
  archive: () => ({ lifecycle_status: "archived", archived_at: now() }),
  reopen: () => ({ lifecycle_status: "open", resolved_at: null, archived_at: null }),
};

/**
 * GET /api/admin/items?type=&status=&lifecycle=&category=&q=&page=&page_size=
 * → { data: Item[], total, page, page_size } (newest first)
 */
router.get("/", async (req, res) => {
  const type = oneOf(req.query.type, ITEM_TYPES, "type");
  const status = oneOf(req.query.status, MODERATION_STATUSES, "status");
  const lifecycle = oneOf(req.query.lifecycle, LIFECYCLE_STATUSES, "lifecycle");
  const paging = pageParams(req.query);

  let query = db.from("items").select(ITEM_COLUMNS, { count: "exact" }).order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);
  if (status) query = query.eq("moderation_status", status);
  if (lifecycle) query = query.eq("lifecycle_status", lifecycle);
  if (req.query.category) query = query.eq("category", String(req.query.category));
  const search = searchFilter(req.query.q, ["title", "description", "location"]);
  if (search) query = query.or(search);

  const page = await runPage(query, paging);
  res.json({ ...page, data: page.data.map(toItem) });
});

/** GET /api/admin/items/:id  →  the item with its claims */
router.get("/:id", async (req, res) => {
  assertUuid(req.params.id);
  const { data, error } = await db
    .from("items")
    .select(`${ITEM_COLUMNS}, claims ( id, status, created_at, claimant:users ( id, full_name, email ) )`)
    .eq("id", req.params.id)
    .order("created_at", { referencedTable: "claims", ascending: false })
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Item not found");
  res.json({ data: toItem(data) });
});

/**
 * POST /api/admin/items/archive-old  body { days? }   (default: the archive_after_days setting)
 * Archives every open publication older than `days` days. → { data: { archived: n, days } }
 */
router.post("/archive-old", async (req, res) => {
  const { archive_after_days } = await getSettings();
  const days = intParam(req.body?.days, { min: 1, max: 3650, fallback: archive_after_days });
  const before = new Date(Date.now() - days * 86400000).toISOString();

  const { data, error } = await db
    .from("items")
    .update({ lifecycle_status: "archived", archived_at: now() })
    .eq("lifecycle_status", "open")
    .lt("created_at", before)
    .select("id");
  if (error) throw error;

  if (data.length) {
    await logActivity(req, {
      action: "items.archive_old",
      targetType: "item",
      targetLabel: `${data.length}`,
      details: { days, count: data.length },
    });
  }
  res.json({ data: { archived: data.length, days } });
});

/**
 * PATCH /api/admin/items/:id  body { title?, description?, type?, category?, location?, event_date? }
 * Edits the content of a publication. → the updated item
 */
router.patch("/:id", async (req, res) => {
  assertUuid(req.params.id);
  const body = req.body ?? {};
  const changes = {
    title: textField(body.title, "title", { max: 120, required: true }),
    description: textField(body.description, "description", { max: 2000 }),
    location: textField(body.location, "location", { max: 120 }),
    type: oneOf(body.type, ITEM_TYPES, "type"),
    category: body.category === undefined ? undefined : String(body.category),
  };
  if (body.event_date !== undefined) {
    if (body.event_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(body.event_date))) {
      throw new HttpError(400, "event_date must be YYYY-MM-DD");
    }
    changes.event_date = body.event_date || null;
  }
  for (const key of Object.keys(changes)) if (changes[key] === undefined) delete changes[key];
  if (!Object.keys(changes).length) throw new HttpError(400, "Nothing to update");

  const { data, error } = await db.from("items").update(changes).eq("id", req.params.id).select(ITEM_COLUMNS).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Item not found");

  await logActivity(req, {
    action: "item.edit",
    targetType: "item",
    targetId: data.id,
    targetLabel: data.title,
    details: { fields: Object.keys(changes) },
  });
  res.json({ data: toItem(data) });
});

/** POST /api/admin/items/:id/(approve|reject|resolve|archive|reopen)  body { note? }  →  the updated item */
router.post("/:id/:action", async (req, res) => {
  assertUuid(req.params.id);
  const changesFor = ACTIONS[req.params.action];
  if (!changesFor) throw new HttpError(404, `Unknown action: ${req.params.action}`);

  const { data, error } = await db
    .from("items")
    .update(changesFor())
    .eq("id", req.params.id)
    .select(ITEM_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Item not found");

  await logActivity(req, {
    action: `item.${req.params.action}`,
    targetType: "item",
    targetId: data.id,
    targetLabel: data.title,
    details: noteDetails(req.body),
  });
  res.json({ data: toItem(data) });
});

/** DELETE /api/admin/items/:id  body { note? }  →  204 (its claims are deleted with it) */
router.delete("/:id", async (req, res) => {
  assertUuid(req.params.id);
  const { data, error } = await db.from("items").delete().eq("id", req.params.id).select("id, title, type");
  if (error) throw error;
  if (!data.length) throw new HttpError(404, "Item not found");

  await logActivity(req, {
    action: "item.delete",
    targetType: "item",
    targetId: data[0].id,
    targetLabel: data[0].title,
    details: { type: data[0].type, ...noteDetails(req.body) },
  });
  res.status(204).end();
});

export default router;
