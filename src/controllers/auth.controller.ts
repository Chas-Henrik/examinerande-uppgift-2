// src/controllers/auth.controller.ts
import config from '../config.js'
import { Request, Response, NextFunction } from 'express';
import bcrypt from "bcrypt"
import { signToken } from '../utils'
import { User, serializeUser } from '../models';
import { UserLevel, UserApiResponse } from "../types";
import { ZodUserSchema, ZodLoginSchema, ZodLoginSchemaType, ZodUserType } from "../validation";

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' as const : 'lax' as const,
    maxAge: 60 * 60 * 1000, // 1 hour
};

// POST /api/auth/register
export const register = async (req: Request, res: Response<UserApiResponse>, next: NextFunction) =>  {
    try {
        // Validate input
        const validatedUser: ZodUserType =  ZodUserSchema.parse({ ...req.body, userLevel: UserLevel[UserLevel.DEVELOPER] });

        // Create user (password will be hashed in pre-save hook in user model)
        const createdUser = await User.create({ ...validatedUser, userLevel: UserLevel.DEVELOPER });

        // Generate JWT token
        const token = signToken({ _id: createdUser._id.toString(), userLevel: createdUser.userLevel });

        return res.status(201).cookie('token', token, COOKIE_OPTIONS).json({ ok: true, message: 'User registered', user: serializeUser(createdUser) });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response<UserApiResponse>, next: NextFunction) =>  {
    try {
        // Validate input
        const { email, password } : ZodLoginSchemaType = ZodLoginSchema.parse(req.body);
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
        next(error);
    }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response<UserApiResponse>, next: NextFunction) =>  {
    try {
        res.clearCookie('token', COOKIE_OPTIONS);
        return res.json({ ok: true, message: 'Logged out successfully' }); 
    } catch (error) {
        next(error);
    }
};

