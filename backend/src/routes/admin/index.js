// Admin API. Every route requires an admin or super admin account (see middleware/auth.js);
// managing roles and system settings additionally requires a super admin.
// Every action that changes data is recorded in activity_logs (see lib/activity.js).
import { Router } from "express";
import { requireAdmin } from "../../middleware/auth.js";
import statsRouter from "./stats.js";
import itemsRouter from "./items.js";
import claimsRouter from "./claims.js";
import usersRouter from "./users.js";
import logsRouter from "./logs.js";
import settingsRouter from "./settings.js";

const router = Router();
router.use(requireAdmin);

/** GET /api/admin/me  →  the signed-in admin { id, full_name, email, role } */
router.get("/me", (req, res) => {
  res.json({ data: req.user });
});

router.use("/stats", statsRouter);
router.use("/settings", settingsRouter);
router.use("/items", itemsRouter);
router.use("/claims", claimsRouter);
router.use("/users", usersRouter);
router.use("/logs", logsRouter);

export default router;
