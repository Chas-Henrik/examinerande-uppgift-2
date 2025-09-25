// src/routes/project.route.ts
import express from "express"
import { createProject, getProjects, getProject, patchProject, deleteProject, getProjectTasks } from "../controllers/project.controller.js";
import { authMiddleware } from "../middleware/authorize.js";
import { generalLimiter } from "../middleware/rateLimiters.js";

const router = express.Router()

router.use(generalLimiter);

// CRUD for projects
router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, getProjects);
router.get("/:id", authMiddleware, getProject);
router.patch("/:id", authMiddleware, patchProject);
router.delete("/:id", authMiddleware, deleteProject);

// Additional routes for projects
router.get("/:id/tasks", authMiddleware, getProjectTasks); // Get tasks for a specific project

export default router;