// src/routes/project.route.ts

import express from "express"
import { authMiddleware, generalLimiter, authorizeProject } from "../middleware";
import { ProjectController } from '../controllers';
import { UserLevel } from '../types';
import { asyncHandler } from '../utils';

const router = express.Router()

router.use(generalLimiter);

// CRUD for projects
router.post("/", authMiddleware, asyncHandler(ProjectController.createProject));
router.get("/", authMiddleware, asyncHandler(ProjectController.getProjects));
router.get("/:id", authMiddleware, asyncHandler(ProjectController.getProject));
router.patch("/:id", authMiddleware, authorizeProject(UserLevel.ADMIN), asyncHandler(ProjectController.patchProject));
router.delete("/:id", authMiddleware, authorizeProject(UserLevel.ADMIN), asyncHandler(ProjectController.deleteProject));

// Additional routes for projects
router.get("/:id/tasks", authMiddleware, asyncHandler(ProjectController.getProjectTasks)); // Get tasks for a specific project

export default router;