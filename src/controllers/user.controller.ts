import { Request, Response } from 'express';
import merge from 'lodash/merge.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User, UserType } from "../models/user.model.js"
import { UserLevel } from '../types/user.js';
import { signToken } from '../utils/jwt.js'
import { AuthenticatedRequest } from "../middleware/authorize.js";
import { COOKIE_OPTIONS } from './auth.controller.js';
import { ZodUserSchema } from "../validation/user.validation.js";

// POST /api/users
export const createUser = async (req: Request, res: Response) =>  {
    try {
        const authReq = req as AuthenticatedRequest;
        const { name, email, password, userLevel } = req.body as UserType;
        
        // Validate input
        const result = ZodUserSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ message: 'Invalid input', error: result.error.issues });
        }

        // Only admins can create new users
        if (authReq.user.userLevel < UserLevel.ADMIN) {
            return res.status(403).json({ message: "Forbidden" });
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

        res.status(201).cookie('token', token, COOKIE_OPTIONS).json({ message: 'User created', user: createdUser });
    } catch (err) {
        res.status(500).json({ message: 'Error creating user', error: err });
    }
};

// GET /api/users
export const getUsers = async (req: Request, res: Response) => {
	try {
        const authReq = req as AuthenticatedRequest;

        // Check authentication
        if (!authReq || !authReq.user || !authReq.user.userLevel) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Only admins can get all users
        if (authReq.user.userLevel < UserLevel.ADMIN) {
            return res.status(403).json({ message: "Forbidden" });
        }

		const users = await User.find();
		res.status(200).json(users);
	} catch (error) {
		console.error("Error fetching users:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ message: "Internal server error", error: errorMessage });
	}
};

// GET /api/users/:id
export const getUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const authReq = req as AuthenticatedRequest;

        // Validate the id format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        // Check authentication
        if (!authReq || !authReq.user || !authReq.user._id.toString()) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Only admins can get all users
        if(authReq.user.userLevel < UserLevel.ADMIN && authReq.user._id.toString() !== id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
};

// PATCH /api/users/:id
export const patchUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userData: UserType = req.body;
        const authReq = req as AuthenticatedRequest;

        // Validate input
        const result = ZodUserSchema.safeParse(userData);
        if (!result.success) {
            return res.status(400).json({ message: 'Invalid input', error: result.error.issues });
        }

        // Validate the id format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        // Check authentication
        if (!authReq || !authReq.user || !authReq.user.userLevel) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Only admins can patch other users
        if ( authReq.user._id.toString() !== id && authReq.user.userLevel < UserLevel.ADMIN) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Validate user level if provided
        if(userData.userLevel) {
            const level = typeof userData.userLevel === 'string' ? UserLevel[userData.userLevel as keyof typeof UserLevel] : userData.userLevel;

            // Validate that you cannot assign a user level higher than your own
            if(level > authReq.user.userLevel) {
                return res.status(403).json({ message: 'Cannot assign a user level higher than your own' });
            }

            userData.userLevel = level;
        }

        // Ensure the user exists
        const existing = await User.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "User not found" });
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
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: 'User updated', user: updatedUser });
    } catch (error) {
        console.error("Error patching user:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
};

// DELETE /api/users/:id
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const authReq = req as AuthenticatedRequest;

        // Validate the id format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        // Check authentication
        if (!authReq || !authReq.user || !authReq.user.userLevel) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Only admins can delete other users
        if ( authReq.user._id.toString() !== id && authReq.user.userLevel < UserLevel.ADMIN) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Delete the user
        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "User not found" });
        }

        // If the user deleted themselves, clear their cookie
        if (authReq.user._id.toString() === id) {
            res.clearCookie('token', COOKIE_OPTIONS);
        }

        res.status(200).json({ message: "User deleted" });
    } catch (error) {
        console.error("Error deleting user:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
};