// src/routes/auth.route.ts

import express from "express"
import { generalLimiter, sensitiveActionLimiter } from "../middleware";
import { AuthController } from '../controllers';
import { asyncHandler } from '../utils';

const router = express.Router()

// CRUD for users
router.post("/register", sensitiveActionLimiter, asyncHandler(AuthController.register));
router.post("/login", sensitiveActionLimiter , AuthController.login);
router.post("/logout", generalLimiter, asyncHandler(AuthController.logout));

export default router;