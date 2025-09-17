// src/controllers/auth.controller.ts
import express, { Request, Response } from 'express';
import bcrypt from "bcrypt"
import { signToken } from '../utils/jwt.js'
import { UserType, User } from '../models/user.model.js';
import { UserLevel, UserApiResponse } from "../types/user.js";
import { ZodUserSchema } from "../validation/user.validation.js";

const router = express.Router();

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 1000, // 1 hour
};

// POST /api/auth/register
export const register = async (req: Request, res: Response<UserApiResponse>) =>  {
    try {
        const { name, email, password } = req.body as UserType;

        // For security reasons, force new users to have DEVELOPER level
        const userLevel = "DEVELOPER";

        // Validate input
        const result = ZodUserSchema.safeParse({ name, email, password, userLevel });
        if (!result.success) {
            return res.status(400).json({ ok: false, message: 'Invalid input', error: result.error.issues.toString() });
        }

        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ ok: false, message: 'User already exists' });
        }

        // Create user (password will be hashed in pre-save hook in user model)
        const createdUser = await User.create({ name, email, password, userLevel: UserLevel[userLevel] });

        // Generate JWT token
        const token = signToken(createdUser.toObject());

        res.status(201).cookie('token', token, COOKIE_OPTIONS).json({ ok: true, message: 'User registered', user: createdUser });
    } catch (error) {
        console.error("Error registering user:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response<UserApiResponse>) =>  {
    try {
        const { email, password } = req.body as { email: string, password: string};
        const user = await User.findOne({ email }).lean();
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ ok: false, message: 'Invalid credentials' });
        }

        const token = signToken(user);

        res.cookie('token', token, COOKIE_OPTIONS).json({ ok: true, message: 'Logged in successfully' });
    } catch (error) {
        console.error("Login failed:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response<UserApiResponse>) =>  {
    try {
        res.clearCookie('token', COOKIE_OPTIONS);
        res.json({ ok: false, message: 'Logged out successfully' }); 
    } catch (error) {
        console.error("Logout failed:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};

export default router;
