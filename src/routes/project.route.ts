// src/routes/project.route.ts
import express from "express"
import { createProject, getProjects, getProject, patchProject, deleteProject, getProjectTasks } from "../controllers/project.controller.js";
import { authMiddleware } from "../middleware/authorize.js";
import { generalLimiter } from "../middleware/rateLimiters.js";

const router = express.Router()

// CRUD for projects
router.post("/", authMiddleware, generalLimiter, createProject);
router.get("/", authMiddleware, generalLimiter, getProjects);
router.get("/:id", authMiddleware, generalLimiter, getProject);
router.patch("/:id", authMiddleware, generalLimiter, patchProject);
router.delete("/:id", authMiddleware, generalLimiter, deleteProject);

// Additional routes for projects
router.get("/:id/tasks", authMiddleware, generalLimiter, getProjectTasks); // Get tasks for a specific project

export default router;