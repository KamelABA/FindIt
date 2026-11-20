// System settings: every admin can read them (the dashboard uses them), only super admins change them.
import { Router } from "express";
import { requireSuperAdmin } from "../../middleware/auth.js";
import { getSettingsDetails, updateSettings } from "../../lib/settings.js";
import { logActivity } from "../../lib/activity.js";

const router = Router();

/** GET /api/admin/settings  →  { data: [{ key, value, updated_at, updated_by }] } */
router.get("/", async (_req, res) => {
  res.json({ data: await getSettingsDetails() });
});

/** PATCH /api/admin/settings  body { key: value, … }  (super admin)  →  same as GET */
router.patch("/", requireSuperAdmin, async (req, res) => {
  const changed = await updateSettings(req.body, req.user.id);
  if (Object.keys(changed).length) {
    await logActivity(req, {
      action: "settings.update",
      targetType: "settings",
      targetLabel: Object.keys(changed).join(", "),
      details: { changes: changed },
    });
  }
  res.json({ data: await getSettingsDetails() });
});

export default router;
