// src/routes/user.route.ts
import express from "express"
import { authMiddleware } from "../middleware/authorize.js";
import { authorizeUser } from "../middleware/authorizeUser.js";
import { UserLevel } from '../types';
import { generalLimiter, sensitiveActionLimiter } from '../middleware/rateLimiters.js';
import { UserController } from '../controllers';

const router = express.Router()

// CRUD for users
router.post("/", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN }), sensitiveActionLimiter , UserController.createUser);
router.get("/", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN }), generalLimiter, UserController.getUsers);
router.get("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), generalLimiter, UserController.getUser);
router.patch("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), sensitiveActionLimiter, UserController.patchUser);
router.delete("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), sensitiveActionLimiter, UserController.deleteUser);

// Additional routes for users
router.get("/:id/tasks", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), UserController.getUserTasks); // Get tasks for a specific user

export default router;