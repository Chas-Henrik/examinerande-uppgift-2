// src/routes/project.route.ts

import express from "express"
import { authenticate, generalLimiter, authorizeProject, validatePagination, validateId } from "../middleware";
import { ProjectController } from '../controllers';
import { UserLevel } from '../types';

const router = express.Router()

router.use(generalLimiter);

// CRUD for projects
router.post("/", authenticate(), ProjectController.createProject);
router.get("/", authenticate(), validatePagination(), ProjectController.getProjects);
router.get("/:id", validateId(), authenticate(), ProjectController.getProject);
router.patch("/:id", validateId(), authenticate(), authorizeProject(UserLevel.ADMIN), ProjectController.patchProject);
router.delete("/:id", validateId(), authenticate(), authorizeProject(UserLevel.ADMIN), ProjectController.deleteProject);

// Additional routes for projects
router.get("/:id/tasks", validateId(), authenticate(), ProjectController.getProjectTasks); // Get tasks for a specific project

export default router;