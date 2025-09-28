// src/routes/user.route.ts

import express from "express"
import { authenticate, authorizeUser, authorizeUserDelete, generalLimiter, sensitiveActionLimiter, validatePagination, validateId } from "../middleware";

import { UserLevel } from '../types';
import { UserController } from '../controllers';
import { asyncHandler } from '../utils';

const router = express.Router()


// CRUD for users
router.post("/", authenticate, authorizeUser({ minUserLevel: UserLevel.ADMIN }), sensitiveActionLimiter , asyncHandler(UserController.createUser));
router.get("/", authenticate, authorizeUser({ minUserLevel: UserLevel.ADMIN }), validatePagination(), generalLimiter, asyncHandler(UserController.getUsers));
router.get("/:id", authenticate, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), validateId(), generalLimiter, asyncHandler(UserController.getUser));
router.patch("/:id", authenticate, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), validateId(), sensitiveActionLimiter, asyncHandler(UserController.patchUser));
router.delete("/:id", authenticate, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), validateId(), authorizeUserDelete(), asyncHandler(UserController.deleteUser));

// Additional routes for users
router.get("/:id/tasks", authenticate, authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), validateId(), asyncHandler(UserController.getUserTasks)); // Get tasks for a specific user

export default router;