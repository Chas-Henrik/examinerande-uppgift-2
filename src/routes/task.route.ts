// src/routes/task.route.ts

import express from "express"
import { authenticate, generalLimiter, validatePagination, validateId } from "../middleware";
import { TaskController } from '../controllers';
import { asyncHandler } from '../utils';

const router = express.Router()

router.use(generalLimiter);

// CRUD for tasks
router.post("/", authenticate, asyncHandler(TaskController.createTask));
router.get("/", authenticate, validatePagination(), asyncHandler(TaskController.getTasks));
router.get("/:id", authenticate, validateId(), asyncHandler(TaskController.getTask));
router.patch("/:id", authenticate, validateId(), asyncHandler(TaskController.patchTask));
router.delete("/:id", authenticate, validateId(), asyncHandler(TaskController.deleteTask));

export default router;