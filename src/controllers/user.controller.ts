// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { User, UserType, Task, serializeUser, serializeTask } from "../models"
import { ApiResponseType } from '../types';
import { AuthenticatedRequest } from "../middleware";
import { COOKIE_NAME, COOKIE_OPTIONS } from './auth.controller.js';
import { ZodUserSchema, ZodUserPatchSchema, ZodUserType, ZodUserPatchType } from "../validation";
import { ApiError, asyncHandler, normalizeUserLevel } from '../utils';

// POST /api/users
export const createUser = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) =>  {
    const userData: UserType = req.body as UserType;
    
    // Validate input
    const validatedUser: ZodUserType =  ZodUserSchema.parse(userData);

    // Normalize and validate userLevel
    const level = normalizeUserLevel(validatedUser.userLevel);
    if (level === undefined) {
        throw new ApiError(400, 'Invalid user level');
    }

    // Create user (password will be hashed in pre-save hook in user model)
    const createdUser = await User.create({ ...validatedUser, userLevel: level });

    res.status(201).json({ ok: true, message: 'User created', data: serializeUser(createdUser) });
});

// GET /api/users
export const getUsers = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
    const { page = '1', size = '10' } = req.query;
	const pageNum = parseInt(page as string);
	const sizeNum = parseInt(size as string);

	const skip = (pageNum - 1) * sizeNum;

    const users = await User.find().lean().skip(skip).limit(sizeNum);

    res.status(200).json({ ok: true, message: 'Users fetched', data: users.map(user => serializeUser(user)) });
});

// GET /api/users/:id
export const getUser = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
    const { id } = req.params;
    const user = await User.findById(id).lean();

    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    res.status(200).json({ ok: true, message: 'User fetched', data: serializeUser(user) });
});

// PATCH /api/users/:id
export const patchUser = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
    const { id } = req.params;
    const userData: UserType = req.body;
    const authReq = req as AuthenticatedRequest;

    // Validate input
    const validatedUser: ZodUserPatchType = ZodUserPatchSchema.parse(userData);

    // Only include fields that were provided in the patch
    const updatePayload: Partial<UserType> = {};
    if (validatedUser.name !== undefined) updatePayload.name = validatedUser.name;
    if (validatedUser.email !== undefined) updatePayload.email = validatedUser.email;
    if (validatedUser.userLevel !== undefined) {
        const level = normalizeUserLevel(validatedUser.userLevel);

        if(level === undefined) {
            throw new ApiError(400, 'Invalid user level');
        }

        if(level > authReq.user.userLevel) {
            throw new ApiError(403, 'Cannot assign a user level higher than your own');
        }
        updatePayload.userLevel = level;
    } 
    if (validatedUser.password) updatePayload.password = validatedUser.password; // Will be hashed in pre-update hook in user model

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(id, updatePayload, {
        new: true,
        runValidators: true,
        upsert: false  // Do not create a new document if it doesn't exist
    }).lean();
    if (!updatedUser) {
        throw new ApiError(404, 'User not found');
    }
    res.status(200).json({ ok: true, message: 'User updated', data: serializeUser(updatedUser) });
});

// DELETE /api/users/:id
export const deleteUser = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;

    // Delete the user
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
        throw new ApiError(404, 'User not found');
    }

    // If the user deleted themselves, clear their cookie
    if (authReq.user._id === id) {
        res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    }

    res.status(200).json({ ok: true, message: "User deleted" });
});

// GET /api/users/:id/tasks
export const getUserTasks = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
    const { id } = req.params;

    const tasks = await Task.find({ assignedTo: id }).lean();
    res.status(200).json({ ok: true, message: 'Tasks fetched', data: tasks.map(task => serializeTask(task)) });
});
