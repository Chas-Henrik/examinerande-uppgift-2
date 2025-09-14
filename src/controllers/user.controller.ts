import { Request, Response } from 'express';
import merge from 'lodash/merge.js';
import mongoose from 'mongoose';
import { User, UserType } from "../models/user.model.js"
import { UserLevel } from '../types/user.js';
import { AuthenticatedRequest } from "../middleware/authorize.js";
import { COOKIE_OPTIONS } from './auth.controller.js';

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

        // Ensure the user exists
        const existing = await User.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "User not found" });
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