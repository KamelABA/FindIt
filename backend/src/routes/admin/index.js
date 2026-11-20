// Admin API. Every route requires an admin account (see middleware/auth.js).
// Every action that changes data is recorded in activity_logs (see lib/activity.js).
import { Router } from "express";
import { requireAdmin } from "../../middleware/auth.js";
import statsRouter from "./stats.js";
import itemsRouter from "./items.js";
import claimsRouter from "./claims.js";
import usersRouter from "./users.js";
import logsRouter from "./logs.js";

const router = Router();
router.use(requireAdmin);

/** GET /api/admin/me  →  the signed-in admin */
router.get("/me", (req, res) => {
  const { id, full_name, email } = req.user;
  res.json({ data: { id, full_name, email } });
});

router.use("/stats", statsRouter);
router.use("/items", itemsRouter);
router.use("/claims", claimsRouter);
router.use("/users", usersRouter);
router.use("/logs", logsRouter);

export default router;
