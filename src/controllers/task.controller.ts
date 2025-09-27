// src/controllers/task.controller.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { User, Task, TaskType, Project } from '../models';
import { TaskApiResponse } from "../types";
import { ZodTaskSchema, ZodTaskPatchSchema, ZodTaskType, ZodTaskPatchType } from '../validation';
import { AuthenticatedRequest } from "../middleware";

// POST /api/tasks
export const createTask = async (req: Request, res: Response<TaskApiResponse>, next: NextFunction) =>  {
	try {
		const authReq = req as AuthenticatedRequest;
		const taskData: TaskType = req.body;

		// Validate input
		const validatedTask: ZodTaskType = ZodTaskSchema.parse(taskData);

		// Validate assignedTo field if provided
		if (validatedTask.assignedTo && !mongoose.isValidObjectId(validatedTask.assignedTo)) {
			return res.status(400).json({ ok: false, message: "Invalid assignedTo user ID format" });
		}

		// If assignedTo is provided, check that the user exists
		if(validatedTask.assignedTo) {
			const user = await User.findById(validatedTask.assignedTo);
			if (!user) {
				return res.status(404).json({ ok: false, message: "assignedTo user not found" });
			}
		}

		// Validate project field if provided
		if (validatedTask.project && !mongoose.isValidObjectId(validatedTask.project)) {
			return res.status(400).json({ ok: false, message: "Invalid project ID format" });
		}
		
		// If project is provided, check that the project exists
		if(validatedTask.project) {
			const projectExists = await Project.exists({ _id: validatedTask.project });
			if (!projectExists) {
				return res.status(404).json({ ok: false, message: "Project not found" });
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
		res.status(201).json({ ok: true, message: 'Task created', task: createdTask });
	} catch (error) {
		next(error);
	}
};

// GET /api/tasks
export const getTasks = async (_req: Request, res: Response<TaskApiResponse>, next: NextFunction) => {
	try {
		const tasks = await Task.find().lean().populate([
			{ path: "assignedTo", select: "name email" },
			{ path: "finishedBy", select: "name email" },
			{ path: "project", select: "name _id" }
		]);
		res.status(200).json({ ok: true, tasks: tasks });
	} catch (error) {
		next(error);
	}
};

// GET /api/tasks/:id
export const getTask = async (req: Request, res: Response<TaskApiResponse>, next: NextFunction) => {
	try {
		const { id } = req.params;
		// Validate the id format
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ ok: false, message: "Invalid task ID format" });
		}
		const task = await Task.findById(id).lean().populate([
			{ path: "assignedTo", select: "name email" },
			{ path: "finishedBy", select: "name email" },
			{ path: "project", select: "name _id" }
		]);
		if (!task) {
			return res.status(404).json({ ok: false, message: "Task not found" });
		}
		res.status(200).json({ ok: true, task: task });
	} catch (error) {
		next(error);
	}
};

// PATCH /api/tasks/:id
export const patchTask = async (req: Request, res: Response<TaskApiResponse>, next: NextFunction) => {
	const { id } = req.params;
	try {
		const authReq = req as AuthenticatedRequest;
		const taskData: TaskType = req.body;

		// Validate input
		const validatedTask: ZodTaskPatchType =  ZodTaskPatchSchema.parse(taskData);

		// Validate the id format
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ ok: false, message: "Invalid task ID format" });
		}

		// Ensure the task exists
		const existing = await Task.findById(id);
		if (!existing) {
			return res.status(404).json({ ok: false, message: "Task not found" });
		}

		// Validate assignedTo field if provided
		if (validatedTask.assignedTo && !mongoose.isValidObjectId(validatedTask.assignedTo)) {
			return res.status(400).json({ ok: false, message: "Invalid assignedTo user ID format" });
		}

		// If assignedTo is provided, check that the user exists
		if(validatedTask.assignedTo) {
			const user = await User.findById(validatedTask.assignedTo);
			if (!user) {
				return res.status(404).json({ ok: false, message: "assignedTo user not found" });
			}
		}

		// Validate project field if provided
		if (validatedTask.project && !mongoose.isValidObjectId(validatedTask.project)) {
			return res.status(400).json({ ok: false, message: "Invalid project ID format" });
		}

		// If project is provided, check that the project exists
		if(validatedTask.project) {
			const projectExists = await Project.exists({ _id: validatedTask.project });
			if (!projectExists) {
				return res.status(404).json({ ok: false, message: "Project not found" });
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
		);
		if (!updatedTask) {
			return res.status(404).json({ ok: false, message: "Task not found" });
		}

		res.status(200).json({ ok: true, message: 'Task updated', task: updatedTask });
	} catch (error) {
		next(error);
	}
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: Request, res: Response<TaskApiResponse>, next: NextFunction) => {
	const { id } = req.params;
	try {
		// Validate the id format
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ ok: false, message: "Invalid task ID format" });
		}

		// Delete the task
		const deleted = await Task.findByIdAndDelete(id);
		if (!deleted) {
			return res.status(404).json({ ok: false, message: "Task not found" });
		}

		res.status(200).json({ ok: true, message: "Task deleted" });
	} catch (error) {
		next(error);
	}
};