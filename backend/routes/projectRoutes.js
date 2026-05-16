import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import * as projects from "../controllers/projectController.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireAdmin, projects.createProject);
router.get("/", projects.listProjects);
router.get("/:id", projects.getProject);
router.put("/:id", requireAdmin, projects.updateProject);
router.delete("/:id", requireAdmin, projects.deleteProject);
router.post("/:id/members", requireAdmin, projects.manageMembers);

export default router;
