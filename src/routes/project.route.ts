// src/routes/project.route.ts

import express from "express"
import { authenticate, generalLimiter, authorizeProject, validatePagination, validateId } from "../middleware";
import { ProjectController } from '../controllers';
import { UserLevel } from '../types';
import { asyncHandler } from '../utils';

const router = express.Router()

router.use(generalLimiter);

// CRUD for projects
router.post("/", authenticate(), asyncHandler(ProjectController.createProject));
router.get("/", authenticate(), validatePagination(), asyncHandler(ProjectController.getProjects));
router.get("/:id", validateId(), authenticate(), asyncHandler(ProjectController.getProject));
router.patch("/:id", validateId(), authenticate(), authorizeProject(UserLevel.ADMIN), asyncHandler(ProjectController.patchProject));
router.delete("/:id", validateId(), authenticate(), authorizeProject(UserLevel.ADMIN), asyncHandler(ProjectController.deleteProject));

// Additional routes for projects
router.get("/:id/tasks", validateId(), authenticate(), asyncHandler(ProjectController.getProjectTasks)); // Get tasks for a specific project

export default router;