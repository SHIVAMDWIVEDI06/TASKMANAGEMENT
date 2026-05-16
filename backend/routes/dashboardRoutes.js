import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import * as dashboard from "../controllers/dashboardController.js";

const router = Router();

router.use(requireAuth);
router.get("/summary", dashboard.dashboardSummary);
router.get("/taskers", requireAdmin, dashboard.dashboardTaskers);

export default router;