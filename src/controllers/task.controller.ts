// src/controllers/task.controller.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User, Task, TaskType, Project, serializeTask } from '../models';
import { ApiResponseType } from "../types";
import { ZodTaskSchema, ZodTaskPatchSchema, ZodTaskType, ZodTaskPatchType } from '../validation';
import { AuthenticatedRequest } from "../middleware";
import { ApiError, asyncHandler, ensureValidObjectId } from '../utils';

// POST /api/tasks
export const createTask = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) =>  {
	const authReq = req as AuthenticatedRequest;
	const taskData: TaskType = req.body;

	// Validate input
	const validatedTask: ZodTaskType = ZodTaskSchema.parse(taskData);

	// Validate assignedTo field if provided and check that the user exists
	if(validatedTask.assignedTo) {
		ensureValidObjectId(validatedTask.assignedTo, 'assignedTo user ID');
		const user = await User.findById(validatedTask.assignedTo);
		if (!user) {
			throw new ApiError(404, 'assignedTo user not found');
		}
	}
	
	// Validate project field if provided and check that the project exists
	if(validatedTask.project) {
		ensureValidObjectId(validatedTask.project, 'project ID');
		const projectExists = await Project.exists({ _id: validatedTask.project });
		if (!projectExists) {
			throw new ApiError(404, 'Project not found');
		}
	}

	// Set finishedAt and finishedBy if status is 'done'
	type FinalTaskType = ZodTaskType & { finishedAt?: Date | null, finishedBy?: mongoose.Types.ObjectId | null };
	let finalTaskData : FinalTaskType = { ...validatedTask };

	if(validatedTask.status === 'done') {
		finalTaskData.finishedAt = new Date();
		finalTaskData.finishedBy = new mongoose.Types.ObjectId(authReq.user._id);
	}

	const createdTask = await Task.create(finalTaskData);
	res.status(201).json({ ok: true, message: 'Task created', data: serializeTask(createdTask) });
});

// GET /api/tasks
export const getTasks = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
	const { page = '1', size = '10' } = req.query;
	const pageNum = parseInt(page as string);
	const sizeNum = parseInt(size as string);

	const skip = (pageNum - 1) * sizeNum;

	const tasks = await Task.find().lean().skip(skip).limit(sizeNum).populate([
		{ path: "assignedTo", select: "name email" },
		{ path: "finishedBy", select: "name email" },
		{ path: "project", select: "name _id" }
	]);
	res.status(200).json({ ok: true, message: 'Tasks fetched', data: tasks.map(task => serializeTask(task)) });
});

// GET /api/tasks/:id
export const getTask = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
	const { id } = req.params;

	const task = await Task.findById(id).lean().populate([
		{ path: "assignedTo", select: "name email" },
		{ path: "finishedBy", select: "name email" },
		{ path: "project", select: "name _id" }
	]);
	if (!task) {
		throw new ApiError(404, 'Task not found');
	}
	res.status(200).json({ ok: true, message: 'Task fetched', data: serializeTask(task) });
});

// PATCH /api/tasks/:id
export const patchTask = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
	const { id } = req.params;
	const authReq = req as AuthenticatedRequest;
	const taskData: TaskType = req.body;

	// Validate input
	const validatedTask: ZodTaskPatchType =  ZodTaskPatchSchema.parse(taskData);

	// Ensure the task exists
	const existing = await Task.findById(id);
	if (!existing) {
		throw new ApiError(404, 'Task not found');
	}

	// Validate assignedTo field if provided and check that the user exists
	if(validatedTask.assignedTo) {
		ensureValidObjectId(validatedTask.assignedTo, 'assignedTo user ID');
		const user = await User.findById(validatedTask.assignedTo);
		if (!user) {
			throw new ApiError(404, 'assignedTo user not found');
		}
	}

	// Validate project field if provided and check that the project exists
	if(validatedTask.project) {
		ensureValidObjectId(validatedTask.project, 'project ID');
		const projectExists = await Project.exists({ _id: validatedTask.project });
		if (!projectExists) {
			throw new ApiError(404, 'Project not found');
		}
	}

	// Add/remove finishedAt and finishedBy when status 'done' is toggled
	type FinalPatchTaskType = ZodTaskPatchType & { finishedAt?: Date | null, finishedBy?: mongoose.Types.ObjectId | null };
	let finalPatchTask : FinalPatchTaskType = { ...validatedTask };

	if(validatedTask.status) {
		if(validatedTask.status === 'done' && existing.status !== 'done') {
			finalPatchTask = { ...validatedTask, finishedAt: new Date(), finishedBy: new mongoose.Types.ObjectId(authReq.user._id) };
		}
		if(validatedTask.status !== 'done' && existing.status === 'done') {
			finalPatchTask = { ...validatedTask, finishedAt: null, finishedBy: null };
		}
	}

	// Update the task in the database
	const updatedTask = await Task.findByIdAndUpdate(
		id,  
		{ $set: finalPatchTask },
		{
			new: true,
			runValidators: true,
			upsert: false  // Do not create a new document if it doesn't exist
		}
	).lean();
	if (!updatedTask) {
		throw new ApiError(404, 'Task not found');
	}

	res.status(200).json({ ok: true, message: 'Task updated', data: serializeTask(updatedTask) });
});

// DELETE /api/tasks/:id
export const deleteTask = asyncHandler(async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
	const { id } = req.params;

	// Delete the task
	const deleted = await Task.findByIdAndDelete(id);
	if (!deleted) {
		throw new ApiError(404, 'Task not found');
	}

	res.status(200).json({ ok: true, message: "Task deleted" });
});