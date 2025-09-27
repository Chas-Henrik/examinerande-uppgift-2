// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { User, UserType, serializeUser, Task } from "../models"
import { UserLevel, UserApiResponse, TaskApiResponse } from '../types';
import { AuthenticatedRequest } from "../middleware";
import { COOKIE_OPTIONS } from './auth.controller.js';
import { ZodUserSchema, ZodUserPatchSchema, ZodUserType, ZodUserPatchType } from "../validation";
import { normalizeUserLevel } from '../utils';

// POST /api/users
export const createUser = async (req: Request, res: Response<UserApiResponse>, next: NextFunction) =>  {
    try {
        const userData: UserType = req.body as UserType;
        
        // Validate input
        const validatedUser: ZodUserType =  ZodUserSchema.parse(userData);

        // Normalize and validate userLevel
        const level = normalizeUserLevel(validatedUser.userLevel);
        if (level === undefined) {
            return res.status(400).json({ ok: false, message: "Invalid user level" });
        }

        // Create user (password will be hashed in pre-save hook in user model)
        const createdUser = await User.create({ ...validatedUser, userLevel: level });

        res.status(201).json({ ok: true, message: 'User created', user: serializeUser(createdUser) });
    } catch (error) {
        next(error);
    }
};

// GET /api/users
export const getUsers = async (req: Request, res: Response<UserApiResponse>, next: NextFunction) => {
	try {
        const users = await User.find().lean();

		res.status(200).json({ ok: true, users: users.map(user => serializeUser(user)) });
	} catch (error) {
		next(error);
	}
};

// GET /api/users/:id
export const getUser = async (req: Request, res: Response<UserApiResponse>, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).lean();

        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }
        res.status(200).json({ ok: true, user: serializeUser(user) });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/users/:id
export const patchUser = async (req: Request, res: Response<UserApiResponse>, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userData: UserType = req.body;
        const authReq = req as AuthenticatedRequest;

        // Validate input
        const validatedUser: ZodUserPatchType = ZodUserPatchSchema.parse(userData);

        // Ensure the user exists
        const existing = await User.findById(id).lean();
        if (!existing) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        // Only include fields that were provided in the patch
        const updatePayload: Partial<UserType> = {};
        if (validatedUser.name !== undefined) updatePayload.name = validatedUser.name;
        if (validatedUser.email !== undefined) updatePayload.email = validatedUser.email;
        if (validatedUser.userLevel !== undefined) {
            const level = normalizeUserLevel(validatedUser.userLevel);

            if(level === undefined) {
                return res.status(400).json({ ok: false, message: "Invalid user level" });
            }

            if(level > authReq.user.userLevel) {
                return res.status(403).json({ ok: false, message: 'Cannot assign a user level higher than your own' });
            }
            updatePayload.userLevel = level;
        } 
        if (validatedUser.password) updatePayload.password = await bcrypt.hash(validatedUser.password, 10);

        // Update the user in the database
        const updatedUser = await User.findByIdAndUpdate(id, updatePayload, {
            new: true,
            runValidators: true,
            upsert: false  // Do not create a new document if it doesn't exist
        });
        if (!updatedUser) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }
        res.status(200).json({ ok: true, message: 'User updated', user: serializeUser(updatedUser) });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response<UserApiResponse>, next: NextFunction) => {
    try {
        const { id } = req.params;
        const authReq = req as AuthenticatedRequest;

        // Delete the user
        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        // If the user deleted themselves, clear their cookie
        if (authReq.user._id === id) {
            res.clearCookie('token', COOKIE_OPTIONS);
        }

        res.status(200).json({ ok: true, message: "User deleted" });
    } catch (error) {
        next(error);
    }
};

// GET /api/users/:id/tasks
export const getUserTasks = async (req: Request, res: Response<TaskApiResponse>, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Check that the user exists
        const userExists = await User.exists({ _id: id });
        if (!userExists) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        const tasks = await Task.find({ assignedTo: id }).lean();
        res.status(200).json({ ok: true, tasks: tasks });
    } catch (error) {
        next(error);
    }
};
