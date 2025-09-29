// src/routes/user.route.ts

import express from "express"
import { authenticate, authorizeUser, authorizeUserDelete, generalLimiter, sensitiveActionLimiter, validatePagination, validateId } from "../middleware";

import { UserLevel } from '../types';
import { UserController } from '../controllers';

const router = express.Router()


// CRUD for users
router.post("/", sensitiveActionLimiter, authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN }) , UserController.createUser);
router.get("/", generalLimiter, authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN }), validatePagination(), UserController.getUsers);
router.get("/:id", generalLimiter, validateId(), authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), UserController.getUser);
router.patch("/:id", sensitiveActionLimiter, validateId(), authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), UserController.patchUser);
router.delete("/:id", generalLimiter, validateId(), authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), authorizeUserDelete(), UserController.deleteUser);

// Additional routes for users
router.get("/:id/tasks", generalLimiter, validateId(), authenticate(), authorizeUser({ minUserLevel: UserLevel.ADMIN, authOwner: true }), UserController.getUserTasks); // Get tasks for a specific user

export default router;