// src/controllers/auth.controller.ts
import express, { Request, Response } from 'express';
import bcrypt from "bcrypt"
import { UserType, User } from '../models/user.model.js';
import { signToken } from '../utils/jwt.js'

const router = express.Router();

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 1000, // 1 hour
};

// POST /api/auth/register
export const register = async (req: Request, res: Response) =>  {
    try {
        const { name, email, password } = req.body as UserType;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const user = new User({ name, email, password });
        const savedUser = await user.save();

        const token = signToken({ id: savedUser._id, email: savedUser.email });

        res.status(201).cookie('token', token, COOKIE_OPTIONS).json({ message: 'User registered' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err });
    }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) =>  {
    try {
        const { email, password } = req.body as { email: string, password: string};
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = signToken({ id: user._id, email: user.email });

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
