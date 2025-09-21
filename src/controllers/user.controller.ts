import { Request, Response } from 'express';
import merge from 'lodash/merge.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User, UserType } from "../models/user.model.js"
import { UserLevel, UserApiResponse } from '../types/user.js';
import { TaskApiResponse } from '../types/task.js';
import { signToken } from '../utils/jwt.js'
import { AuthenticatedRequest } from "../middleware/authorize.js";
import { COOKIE_OPTIONS } from './auth.controller.js';
import { ZodUserSchema } from "../validation/user.validation.js";
import { Task } from '../models/task.model.js';
import { z } from 'zod';

// POST /api/users
export const createUser = async (req: Request, res: Response<UserApiResponse>) =>  {
    try {
        const authReq = req as AuthenticatedRequest;
        const { name, email, password, userLevel } = req.body as UserType;
        
        // Validate input
        const result = ZodUserSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ ok: false, message: 'Invalid input', error: z.treeifyError(result.error) });
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

        // Create user (password will be hashed in pre-save hook in user model)
        const createdUser = await User.create({ name, email, password, userLevel: UserLevel[userLevel] });

        // Generate JWT token
        const token = signToken({_id: createdUser._id.toString(), userLevel: userLevel });

        res.status(201).cookie('token', token, COOKIE_OPTIONS).json({ ok: true, message: 'User created', user: createdUser });
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
        if (!authReq || !authReq.user || !authReq.user.userLevel) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        // Only admins can get all users
        if (authReq.user.userLevel < UserLevel.ADMIN) {
            return res.status(403).json({ ok: false, message: "Forbidden, only admins can get all users" });
        }

		const users = await User.find();
		res.status(200).json({ ok: true, users: users });
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
        if (!authReq || !authReq.user || !authReq.user._id) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        // Only admins can get other users
        if(authReq.user.userLevel < UserLevel.ADMIN && authReq.user._id !== id) {
            return res.status(403).json({ ok: false, message: "Forbidden, only admins can get other users" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }
        res.status(200).json({ ok: true, user: user });
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
        const result = ZodUserSchema.safeParse(userData);
        if (!result.success) {
            return res.status(400).json({ ok: false, message: 'Invalid input', error: z.treeifyError(result.error) });
        }

        // Validate the id format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ ok: false, message: "Invalid user ID format" });
        }

        // Check authentication
        if (!authReq || !authReq.user || !authReq.user.userLevel) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        // Only admins can patch other users
        if ( authReq.user._id !== id && authReq.user.userLevel < UserLevel.ADMIN) {
            return res.status(403).json({ ok: false, message: "Forbidden, only admins can patch other users" });
        }

        // Validate user level if provided
        if(userData.userLevel) {
            const level = typeof userData.userLevel === 'string' ? UserLevel[userData.userLevel as keyof typeof UserLevel] : userData.userLevel;

            // Validate that you cannot assign a user level higher than your own
            if(level > authReq.user.userLevel) {
                return res.status(403).json({ ok: false, message: 'Cannot assign a user level higher than your own' });
            }

            userData.userLevel = level;
        }

        // Ensure the user exists
        const existing = await User.findById(id);
        if (!existing) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        // If password is being updated, hash it
        if(userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        // Deep merge the existing user with the patch input
        const mergedData = merge({}, existing.toObject(), userData);

        // Update the user in the database
        const updatedUser = await User.findByIdAndUpdate(id, mergedData, {
            new: true,
            runValidators: true,
            upsert: false  // Do not create a new document if it doesn't exist
        });
        if (!updatedUser) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }
        res.status(200).json({ ok: true, message: 'User updated', user: updatedUser });
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
        if (!authReq || !authReq.user || !authReq.user.userLevel) {
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

        const tasks = await Task.find({ assignedTo: id });
        res.status(200).json({ ok: true, tasks: tasks });
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};
