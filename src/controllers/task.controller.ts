import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Task, TaskType } from "../models/task.model.js"
import { User } from '../models/user.model.js';
import { TaskApiResponse } from "../types/task.js";
import { ZodTaskSchema, ZodTaskPatchSchema } from '../validation/task.validation.js';
import { AuthenticatedRequest } from "../middleware/authorize.js";
import { z } from 'zod';
import { Project } from '../models/project.model.js';

// POST /api/tasks
export const createTask = async (req: Request, res: Response<TaskApiResponse>) =>  {
	try {
		const authReq = req as AuthenticatedRequest;
		const taskData: TaskType = req.body;

		// Validate input
		const result = ZodTaskSchema.safeParse(taskData);
		if (!result.success) {
			return res.status(400).json({ ok: false, message: 'Invalid input', error: z.treeifyError(result.error) });
		}

		// Validate assignedTo field if provided
		if (taskData.assignedTo && !mongoose.isValidObjectId(taskData.assignedTo)) {
			return res.status(400).json({ ok: false, message: "Invalid assignedTo user ID format" });
		}

		// If assignedTo is provided, check that the user exists
		if(taskData.assignedTo) {
			const user = await User.findById(taskData.assignedTo);
			if (!user) {
				return res.status(404).json({ ok: false, message: "assignedTo user not found" });
			}
		}

		// Validate project field if provided
		if (taskData.project && !mongoose.isValidObjectId(taskData.project)) {
			return res.status(400).json({ ok: false, message: "Invalid project ID format" });
		}
		
		// If project is provided, check that the project exists
		if(taskData.project) {
			const projectExists = await Project.exists({ _id: taskData.project });
			if (!projectExists) {
				return res.status(404).json({ ok: false, message: "Project not found" });
			}
		}

		// Set finishedAt and finishedBy if status is 'done'
		if(taskData.status === 'done' && !taskData.finishedBy) {
			if(!taskData.finishedAt) taskData.finishedAt = new Date();
			if(!taskData.finishedBy &&  mongoose.isValidObjectId(authReq.user?._id)) taskData.finishedBy = new mongoose.Types.ObjectId(authReq.user?._id);
		}

		const createdTask = await Task.create(taskData);
		res.status(201).json({ ok: true, message: 'Task created', task: createdTask });
	} catch (error) {
		console.error("Error creating task:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};

// GET /api/tasks
export const getTasks = async (_req: Request, res: Response<TaskApiResponse>) => {
	try {
		const tasks = await Task.find().populate([
			{ path: "assignedTo", select: "name email" },
			{ path: "finishedBy", select: "name email" },
			{ path: "project", select: "name _id" }
		]);
		res.status(200).json({ ok: true, tasks: tasks });
	} catch (error) {
		console.error("Error fetching tasks:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};

// GET /api/tasks/:id
export const getTask = async (req: Request, res: Response<TaskApiResponse>) => {
	try {
		const { id } = req.params;
		// Validate the id format
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ ok: false, message: "Invalid task ID format" });
		}
		const task = await Task.findById(id).populate([
			{ path: "assignedTo", select: "name email" },
			{ path: "finishedBy", select: "name email" },
			{ path: "project", select: "name _id" }
		]);
		if (!task) {
			return res.status(404).json({ ok: false, message: "Task not found" });
		}
		res.status(200).json({ ok: true, task: task });
	} catch (error) {
		console.error("Error fetching task:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};

// PATCH /api/tasks/:id
export const patchTask = async (req: Request, res: Response<TaskApiResponse>) => {
	try {
		const authReq = req as AuthenticatedRequest;
		const taskData: TaskType = req.body;
		const { id } = req.params;

		// Validate input
		const result = ZodTaskPatchSchema.safeParse(taskData);
		if (!result.success) {
			return res.status(400).json({ ok: false, message: 'Invalid input', error: z.treeifyError(result.error) });
		}

		const patchData = result.data;

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
		if (patchData.assignedTo && !mongoose.isValidObjectId(patchData.assignedTo)) {
			return res.status(400).json({ ok: false, message: "Invalid assignedTo user ID format" });
		}

		// If assignedTo is provided, check that the user exists
		if(patchData.assignedTo) {
			const user = await User.findById(patchData.assignedTo);
			if (!user) {
				return res.status(404).json({ ok: false, message: "assignedTo user not found" });
			}
		}

		// Validate project field if provided
		if (patchData.project && !mongoose.isValidObjectId(patchData.project)) {
			return res.status(400).json({ ok: false, message: "Invalid project ID format" });
		}

		// If project is provided, check that the project exists
		if(patchData.project) {
			const projectExists = await Project.exists({ _id: patchData.project });
			if (!projectExists) {
				return res.status(404).json({ ok: false, message: "Project not found" });
			}
		}

		// Set finishedAt and finishedBy if status is 'done'
		if(patchData.status === 'done' && !patchData.finishedBy) {
			if(!patchData.finishedAt) patchData.finishedAt = new Date();
			if(!patchData.finishedBy ) patchData.finishedBy = authReq?.user?._id;
		}

		// Update the task in the database
		const updatedTask = await Task.findByIdAndUpdate(id, patchData, {
			new: true,
			runValidators: true,
			upsert: false  // Do not create a new document if it doesn't exist
		});
		if (!updatedTask) {
			return res.status(404).json({ ok: false, message: "Task not found" });
		}
		res.status(200).json({ ok: true, message: 'Task updated', task: updatedTask });
	} catch (error) {
		console.error("Error patching task:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: Request, res: Response<TaskApiResponse>) => {
	try {
		const { id } = req.params;

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
		console.error("Error deleting task:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};