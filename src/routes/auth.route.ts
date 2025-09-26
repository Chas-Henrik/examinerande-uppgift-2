// src/routes/auth.route.ts
import express from "express"
import { generalLimiter, sensitiveActionLimiter } from "../middleware/index.js";
import { AuthController } from '../controllers';

const router = express.Router()

// CRUD for users
router.post("/register", sensitiveActionLimiter, AuthController.register);
router.post("/login", sensitiveActionLimiter , AuthController.login);
router.post("/logout", generalLimiter, AuthController.logout);

export default router;