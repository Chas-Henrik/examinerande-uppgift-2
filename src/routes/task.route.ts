// src/routes/task.route.ts
import express from "express"
import { createTask, getTasks, getTask, patchTask, deleteTask } from "../controllers/task.controller.js";
import { authMiddleware } from "../middleware/authorize.js";
import { generalLimiter } from "../middleware/rateLimiters.js";

const router = express.Router()

// CRUD for tasks
router.post("/", authMiddleware, generalLimiter, createTask);
router.get("/", authMiddleware, generalLimiter, getTasks);
router.get("/:id", authMiddleware, generalLimiter, getTask);
router.patch("/:id", authMiddleware, generalLimiter, patchTask);
router.delete("/:id", authMiddleware, generalLimiter, deleteTask);

export default router;