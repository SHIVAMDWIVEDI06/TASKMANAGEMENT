import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import * as tasks from "../controllers/taskController.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireAdmin, tasks.createTask);
router.get("/", tasks.listTasks);
router.get("/:id", tasks.getTask);
router.put("/:id", tasks.updateTask);
router.delete("/:id", requireAdmin, tasks.deleteTask);

export default router;
