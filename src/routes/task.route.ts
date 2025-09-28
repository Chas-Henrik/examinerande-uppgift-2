// src/routes/task.route.ts

import express from "express"
import { authMiddleware, generalLimiter } from "../middleware";
import { TaskController } from '../controllers';
import { asyncHandler } from '../utils';

const router = express.Router()

router.use(generalLimiter);

// CRUD for tasks
router.post("/", authMiddleware, asyncHandler(TaskController.createTask));
router.get("/", authMiddleware, asyncHandler(TaskController.getTasks));
router.get("/:id", authMiddleware, asyncHandler(TaskController.getTask));
router.patch("/:id", authMiddleware, asyncHandler(TaskController.patchTask));
router.delete("/:id", authMiddleware, asyncHandler(TaskController.deleteTask));

export default router;