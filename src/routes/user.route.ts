// src/routes/user.route.ts
import express from "express"
import { authMiddleware } from "../middleware/authorize.js";
import { createUser, getUsers, getUser, patchUser, deleteUser, getUserTasks } from "../controllers/user.controller.js";
import { sensitiveActionLimiter } from '../middleware/rateLimiters.js';

const router = express.Router()

// CRUD for users
router.post("/", authMiddleware, sensitiveActionLimiter , createUser);
router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, getUser);
router.patch("/:id", authMiddleware, sensitiveActionLimiter, patchUser);
router.delete("/:id", authMiddleware, sensitiveActionLimiter, deleteUser);

// Additional routes for users
router.get("/:id/tasks", authMiddleware, getUserTasks); // Get tasks for a specific user

export default router;