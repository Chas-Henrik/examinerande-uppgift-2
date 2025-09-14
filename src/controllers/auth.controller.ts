// src/controllers/auth.controller.ts
import express, { Request, Response } from 'express';
import bcrypt from "bcrypt"
import { signToken } from '../utils/jwt.js'
import { UserType, User } from '../models/user.model.js';
import { UserLevel } from "../types/user.js";
import { ZodUserSchema } from "../validation/user.validation.js";

const router = express.Router();

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 1000, // 1 hour
};

// POST /api/auth/register
export const register = async (req: Request, res: Response) =>  {
    try {
        const { name, email, password } = req.body as UserType;

        // For security reasons, force new users to have DEVELOPER level
        const userLevel = "DEVELOPER";

        // Validate input
        const result = ZodUserSchema.safeParse({ name, email, password, userLevel });
        if (!result.success) {
            return res.status(400).json({ message: 'Invalid input', error: result.error.issues });
        }

        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Create user (password will be hashed in pre-save hook in user model)
        const createdUser = await User.create({ name, email, password, userLevel: UserLevel[userLevel] });

        // Generate JWT token
        const token = signToken(createdUser.toObject());

        res.status(201).cookie('token', token, COOKIE_OPTIONS).json({ message: 'User registered', user: createdUser });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err });
    }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) =>  {
    try {
        const { email, password } = req.body as { email: string, password: string};
        const user = await User.findOne({ email }).lean();
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = signToken(user);

        res.cookie('token', token, COOKIE_OPTIONS).json({ message: 'Logged in successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err });
    }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) =>  {
    res.clearCookie('token', COOKIE_OPTIONS);
    res.json({ message: 'Logged out successfully' });
};

export default router;
