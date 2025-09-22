// src/routes/auth.route.ts
import express from "express"
import { register, login, logout } from '../controllers/auth.controller.js';
import { authLimiter  } from '../middleware/rateLimiters.js';

const router = express.Router()

// CRUD for users
router.post("/register", authLimiter, register);
router.post("/login", authLimiter , login);
router.post("/logout", logout);

export default router;