// src/controllers/auth.controller.ts
import config from '../config.js'
import { Request, Response, NextFunction } from 'express';
import bcrypt from "bcrypt"
import { signToken } from '../utils'
import { User, serializeUser } from '../models';
import { UserLevel, ApiResponseType } from "../types";
import { ZodUserSchema, ZodLoginSchema, ZodLoginSchemaType, ZodUserType } from "../validation";
import { ApiError } from "../utils"; // Adjust path if ApiError is in a different module

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' as const : 'lax' as const,
    maxAge: 60 * 60 * 1000, // 1 hour
};

export const COOKIE_NAME = 'token';

// POST /api/auth/register
export const register = async (req: Request, res: Response<ApiResponseType>, next: NextFunction) =>  {
    // Validate input
    const validatedUser: ZodUserType =  ZodUserSchema.parse({ ...req.body, userLevel: UserLevel[UserLevel.DEVELOPER] });

    // Create user (password will be hashed in pre-save hook in user model)
    const createdUser = await User.create({ ...validatedUser, userLevel: UserLevel.DEVELOPER });

    // Generate JWT token
    const token = signToken({ _id: createdUser._id.toString(), userLevel: createdUser.userLevel });

    return res.status(201).cookie(COOKIE_NAME, token, COOKIE_OPTIONS).json({ ok: true, message: 'User registered', data: serializeUser(createdUser) });
};

// POST /api/auth/login
export const login = async (req: Request, res: Response<ApiResponseType>, next: NextFunction) =>  {
    try {
        // Validate input
        const { email, password } : ZodLoginSchemaType = ZodLoginSchema.parse(req.body);
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password').lean();

        if (!user?.password || !await bcrypt.compare(password, user.password)) {
            // Dummy bcrypt hash to mitigate timing attacks
            const dummyHash = '$2b$10$invalidsaltinvalidsaltinv.uFzQxGZ7yQzW9X0mFq2e2K';
            await bcrypt.compare(password, dummyHash); // for timing consistency
            res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
            throw new ApiError(401, 'Invalid credentials');
        }

        const token = signToken({ _id: user._id.toString(), userLevel: user.userLevel });

        return res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS).json({ ok: true, message: 'Logged in successfully', data: serializeUser(user) });
    } catch (error) {
        res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
        next(error);
    }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response<ApiResponseType>, next: NextFunction) =>  {
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    return res.json({ ok: true, message: 'Logged out successfully' }); 
};

