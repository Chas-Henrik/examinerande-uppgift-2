// src/routes/user.route.ts

import express from "express"
import { authenticate, authorizeUser, authorizeUserDelete, generalLimiter, sensitiveActionLimiter, validatePagination, validateId } from "../middleware";

import { UserLevel } from '../types';
import { UserController } from '../controllers';
import { asyncHandler } from '../utils';

const router = express.Router()


// CRUD for users
router.post("/", sensitiveActionLimiter, authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN }) , asyncHandler(UserController.createUser));
router.get("/", generalLimiter, authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN }), validatePagination(), asyncHandler(UserController.getUsers));
router.get("/:id", generalLimiter, validateId(), authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), asyncHandler(UserController.getUser));
router.patch("/:id", sensitiveActionLimiter, validateId(), authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), asyncHandler(UserController.patchUser));
router.delete("/:id", generalLimiter, validateId(), authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), authorizeUserDelete(), asyncHandler(UserController.deleteUser));

// Additional routes for users
router.get("/:id/tasks", generalLimiter, validateId(), authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), asyncHandler(UserController.getUserTasks)); // Get tasks for a specific user

export default router;