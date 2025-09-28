// src/routes/user.route.ts

import express from "express"
import { authMiddleware, authorizeUser, authorizeUserDelete, generalLimiter, sensitiveActionLimiter } from "../middleware";
import { UserLevel } from '../types';
import { UserController } from '../controllers';

const router = express.Router()

// CRUD for users
router.post("/", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN }), sensitiveActionLimiter , UserController.createUser);
router.get("/", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN }), generalLimiter, UserController.getUsers);
router.get("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), generalLimiter, UserController.getUser);
router.patch("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), sensitiveActionLimiter, UserController.patchUser);
router.delete("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), authorizeUserDelete(), UserController.deleteUser);

// Additional routes for users
router.get("/:id/tasks", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), UserController.getUserTasks); // Get tasks for a specific user

export default router;