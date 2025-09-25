// src/routes/auth.route.ts
import express from "express"
import { register, login, logout } from '../controllers/auth.controller.js';
import { sensitiveActionLimiter  } from '../middleware/rateLimiters.js';
import { generalLimiter } from "../middleware/rateLimiters.js";

const router = express.Router()

// CRUD for users
router.post("/register", sensitiveActionLimiter, register);
router.post("/login", sensitiveActionLimiter , login);
router.post("/logout", generalLimiter, logout);

export default router;