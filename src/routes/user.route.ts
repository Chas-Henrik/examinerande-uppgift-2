// src/routes/user.route.ts
import express from "express"
import { authMiddleware } from "../middleware/authorize.js";
import { authorizeUser } from "../middleware/authorizeUser.js";
import { UserLevel } from "../types/user.js";
import { createUser, getUsers, getUser, patchUser, deleteUser, getUserTasks } from "../controllers/user.controller.js";
import { sensitiveActionLimiter } from '../middleware/rateLimiters.js';

const router = express.Router()

// CRUD for users
router.post("/", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN }), sensitiveActionLimiter , createUser);
router.get("/", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN }), getUsers);
router.get("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), getUser);
router.patch("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), sensitiveActionLimiter, patchUser);
router.delete("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), sensitiveActionLimiter, deleteUser);

// Additional routes for users
router.get("/:id/tasks", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), getUserTasks); // Get tasks for a specific user

export default router;