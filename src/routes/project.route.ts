// src/routes/project.route.ts
import express from "express"
import { authMiddleware, generalLimiter, authorizeProject } from "../middleware";
import { ProjectController } from '../controllers';
import { UserLevel } from '../types';

const router = express.Router()

router.use(generalLimiter);

// CRUD for projects
router.post("/", authMiddleware, ProjectController.createProject);
router.get("/", authMiddleware, ProjectController.getProjects);
router.get("/:id", authMiddleware, ProjectController.getProject);
router.patch("/:id", authMiddleware, authorizeProject(UserLevel.ADMIN), ProjectController.patchProject);
router.delete("/:id", authMiddleware, authorizeProject(UserLevel.ADMIN), ProjectController.deleteProject);

// Additional routes for projects
router.get("/:id/tasks", authMiddleware, ProjectController.getProjectTasks); // Get tasks for a specific project

export default router;