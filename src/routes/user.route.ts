// src/routes/user.route.ts

import express from "express"
import { authMiddleware, authorizeUser, authorizeUserDelete, generalLimiter, sensitiveActionLimiter } from "../middleware";
import { UserLevel } from '../types';
import { UserController } from '../controllers';
import { asyncHandler } from '../utils';

const router = express.Router()


// CRUD for users
router.post("/", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN }), sensitiveActionLimiter , asyncHandler(UserController.createUser));
router.get("/", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN }), generalLimiter, asyncHandler(UserController.getUsers));
router.get("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), generalLimiter, asyncHandler(UserController.getUser));
router.patch("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), sensitiveActionLimiter, asyncHandler(UserController.patchUser));
router.delete("/:id", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), authorizeUserDelete(), asyncHandler(UserController.deleteUser));

// Additional routes for users
router.get("/:id/tasks", authMiddleware, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), asyncHandler(UserController.getUserTasks)); // Get tasks for a specific user

export default router;