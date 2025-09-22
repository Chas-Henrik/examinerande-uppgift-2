// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User, UserType, serializeUser } from "../models/user.model.js"
import { UserLevel, UserApiResponse } from '../types/user.js';
import { TaskApiResponse } from '../types/task.js';
import { AuthenticatedRequest } from "../middleware/authorize.js";
import { COOKIE_OPTIONS } from './auth.controller.js';
import { ZodUserSchema, ZodUserPatchSchema } from "../validation/user.validation.js";
import { Task } from '../models/task.model.js';
import { normalizeUserLevel } from '../utils/utils.js';

// POST /api/users
export const createUser = async (req: Request, res: Response<UserApiResponse>) =>  {
    try {
        const authReq = req as AuthenticatedRequest;
        const { name, email, password, userLevel } = req.body as UserType;
        
        // Validate input
        const result = ZodUserSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ 
                ok: false, 
                message: 'Invalid input', 
                error: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
            });
        }

        // Only admins can create new users
        if (authReq.user.userLevel < UserLevel.ADMIN) {
            return res.status(403).json({ ok: false, message: "Forbidden, only admins can create new users" });
        }

        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ ok: false, message: 'User already exists' });
        }

        // Normalize and validate userLevel
        const level = normalizeUserLevel(userLevel);
        if (level === undefined) {
            return res.status(400).json({ ok: false, message: "Invalid user level" });
        }

        // Create user (password will be hashed in pre-save hook in user model)
        const createdUser = await User.create({ name, email, password, userLevel: level });

        res.status(201).json({ ok: true, message: 'User created', user: serializeUser(createdUser) });
    } catch (error) {
        console.error("Error creating user:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};

// GET /api/users
export const getUsers = async (req: Request, res: Response<UserApiResponse>) => {
	try {
        const authReq = req as AuthenticatedRequest;

        // Check authentication
        if (!authReq.user?.userLevel) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        // Only admins can get all users
        if (authReq.user.userLevel < UserLevel.ADMIN) {
            return res.status(403).json({ ok: false, message: "Forbidden, only admins can get all users" });
        }

		const users = await User.find().lean();
		res.status(200).json({ ok: true, users: users.map(user => serializeUser(user)) });
	} catch (error) {
		console.error("Error fetching users:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};

// GET /api/users/:id
export const getUser = async (req: Request, res: Response<UserApiResponse>) => {
    try {
        const { id } = req.params;
        const authReq = req as AuthenticatedRequest;

        // Validate the id format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ ok: false, message: "Invalid user ID format" });
        }

        // Check authentication
        if (!authReq.user?.userLevel) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        // Only admins can get other users
        if(authReq.user.userLevel < UserLevel.ADMIN && authReq.user._id !== id) {
            return res.status(403).json({ ok: false, message: "Forbidden, only admins can get other users" });
        }

        const user = await User.findById(id).lean();
        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }
        res.status(200).json({ ok: true, user: serializeUser(user) });
    } catch (error) {
        console.error("Error fetching user:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};

// PATCH /api/users/:id
export const patchUser = async (req: Request, res: Response<UserApiResponse>) => {
    try {
        const { id } = req.params;
        const userData: UserType = req.body;
        const authReq = req as AuthenticatedRequest;

        // Validate input
        const result = ZodUserPatchSchema.safeParse(userData);
        if (!result.success) {
            return res.status(400).json({ 
                ok: false, 
                message: 'Invalid input', 
                error: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) 
            });
        }

        const patchData = result.data;

        // Validate the id format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ ok: false, message: "Invalid user ID format" });
        }

        // Check authentication
        if (!authReq.user?.userLevel) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        // Only admins can patch other users
        if ( authReq.user._id !== id && authReq.user.userLevel < UserLevel.ADMIN) {
            return res.status(403).json({ ok: false, message: "Forbidden, only admins can patch other users" });
        }

        // Ensure the user exists
        const existing = await User.findById(id).lean();
        if (!existing) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        // Only include fields that were provided in the patch
        const updatePayload: Partial<UserType> = {};
        if (patchData.name !== undefined) updatePayload.name = patchData.name;
        if (patchData.email !== undefined) updatePayload.email = patchData.email;
        if (patchData.userLevel !== undefined) {
            const level = normalizeUserLevel(patchData.userLevel);

            if(level === undefined) {
                return res.status(400).json({ ok: false, message: "Invalid user level" });
            }

            if(level > authReq.user.userLevel) {
                return res.status(403).json({ ok: false, message: 'Cannot assign a user level higher than your own' });
            }
            updatePayload.userLevel = level;
        } 
        if (patchData.password) updatePayload.password = await bcrypt.hash(patchData.password, 10);

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
        console.error("Error patching user:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response<UserApiResponse>) => {
    try {
        const { id } = req.params;
        const authReq = req as AuthenticatedRequest;

        // Validate the id format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ ok: false, message: "Invalid user ID format" });
        }

        // Check authentication
        if (!authReq.user?.userLevel) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        // Only admins can delete other users
        if ( authReq.user._id !== id && authReq.user.userLevel < UserLevel.ADMIN) {
            return res.status(403).json({ ok: false, message: "Forbidden, only admins can delete other users" });
        }

        // admins cannot delete themselves (to guarantee at least one admin user exists)
        if (authReq.user._id === id && authReq.user.userLevel === UserLevel.ADMIN) {
            return res.status(403).json({ ok: false, message: "Forbidden, admin users cannot delete themselves" });
        }

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
        console.error("Error deleting user:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};

// GET /api/users/:id/tasks
export const getUserTasks = async (req: Request, res: Response<TaskApiResponse>) => {
    try {
        const { id } = req.params;

        // Validate the id format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ ok: false, message: "Invalid user ID format" });
        }

        // Check that the user exists
        const userExists = await User.exists({ _id: id });
        if (!userExists) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        const tasks = await Task.find({ assignedTo: id }).lean();
        res.status(200).json({ ok: true, tasks: tasks });
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};
