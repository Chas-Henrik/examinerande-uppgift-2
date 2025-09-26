// src/controllers/auth.controller.ts
import config from '../config.js'
import { Request, Response } from 'express';
import bcrypt from "bcrypt"
import { signToken, formatZodError } from '../utils'
import { User, serializeUser } from '../models';
import { UserLevel, UserApiResponse } from "../types";
import { ZodUserSchema, ZodLoginSchema, ZodLoginSchemaType } from "../validation";

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' as const : 'lax' as const,
    maxAge: 60 * 60 * 1000, // 1 hour
};

// POST /api/auth/register
export const register = async (req: Request, res: Response<UserApiResponse>) =>  {
    try {
        // Force new users to have DEVELOPER level
        const userLevel = UserLevel.DEVELOPER;

        // Validate input
        const result = ZodUserSchema.safeParse({ ...req.body, userLevel: UserLevel[userLevel] });
        if (!result.success) {
            return res.status(400).json({ 
                ok: false, 
                message: 'Invalid input',
                error: formatZodError(result.error)
            });
        }
        const { name, email, password } = result.data;

        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ ok: false, message: 'User already exists' });
        }

        // Create user (password will be hashed in pre-save hook in user model)
        const createdUser = await User.create({ name, email, password, userLevel });

        // Generate JWT token
        const token = signToken({ _id: createdUser._id.toString(), userLevel });

        return res.status(201).cookie('token', token, COOKIE_OPTIONS).json({ ok: true, message: 'User registered', user: serializeUser(createdUser) });
    } catch (error) {
        console.error("Error registering user:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response<UserApiResponse>) =>  {
    try {
        // Validate input
        const result = ZodLoginSchema.safeParse(req.body);
        if (!result.success) {
            res.clearCookie('token', COOKIE_OPTIONS);
            return res.status(400).json({ 
                ok: false, 
                message: 'Invalid input', 
                error: formatZodError(result.error) 
            });
        }
        const { email, password } : ZodLoginSchemaType = result.data;
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password').lean();

        if (!user?.password || !await bcrypt.compare(password, user.password)) {
            // Dummy bcrypt hash to mitigate timing attacks
            const dummyHash = '$2b$10$invalidsaltinvalidsaltinv.uFzQxGZ7yQzW9X0mFq2e2K';
            await bcrypt.compare(password, dummyHash); // for timing consistency
            res.clearCookie('token', COOKIE_OPTIONS);
            return res.status(401).json({ ok: false, message: 'Invalid credentials' });
        }

        const token = signToken({ _id: user._id.toString(), userLevel: user.userLevel });

        return res.cookie('token', token, COOKIE_OPTIONS).json({ ok: true, message: 'Logged in successfully', user: serializeUser(user) });
    } catch (error) {
        res.clearCookie('token', COOKIE_OPTIONS);
        console.error("Login failed:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response<UserApiResponse>) =>  {
    try {
        res.clearCookie('token', COOKIE_OPTIONS);
        return res.json({ ok: true, message: 'Logged out successfully' }); 
    } catch (error) {
        console.error("Logout failed:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};

