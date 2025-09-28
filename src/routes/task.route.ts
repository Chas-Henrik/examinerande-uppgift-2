// src/routes/task.route.ts

import express from "express"
import { authMiddleware, generalLimiter } from "../middleware";
import { TaskController } from '../controllers';

const router = express.Router()

router.use(generalLimiter);

// CRUD for tasks
router.post("/", authMiddleware, TaskController.createTask);
router.get("/", authMiddleware, TaskController.getTasks);
router.get("/:id", authMiddleware, TaskController.getTask);
router.patch("/:id", authMiddleware, TaskController.patchTask);
router.delete("/:id", authMiddleware, TaskController.deleteTask);

export default router;