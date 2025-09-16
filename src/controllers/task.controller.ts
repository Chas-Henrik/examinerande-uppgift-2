import { Request, Response } from 'express';
import merge from 'lodash/merge.js';
import mongoose from 'mongoose';
import { Task, TaskType } from "../models/task.model.js"
import { User } from '../models/user.model.js';
import { ZodTaskSchema } from '../validation/task.validation.js';
import { AuthenticatedRequest } from "../middleware/authorize.js";

// POST /api/tasks
export const createTask = async (req: Request, res: Response) =>  {
	try {
		const authReq = req as AuthenticatedRequest;
		const taskData: TaskType = req.body;

		// Validate input
		const result = ZodTaskSchema.safeParse(taskData);
		if (!result.success) {
			return res.status(400).json({ message: 'Invalid input', error: result.error.issues });
		}

		// Validate assignedTo field if provided
		if (taskData.assignedTo && !mongoose.isValidObjectId(taskData.assignedTo)) {
			return res.status(400).json({ error: "Invalid assignedTo user ID format" });
		}

		// If assignedTo is provided, check that the user exists
		if(taskData.assignedTo) {
			const user = await User.findById(taskData.assignedTo);
			if (!user) {
				return res.status(404).json({ error: "assignedTo user not found" });
			}
		}

		// Set finishedAt and finishedBy if status is 'done'
		if(taskData.status === 'done' && !taskData.finishedBy) {
			if(!taskData.finishedAt) taskData.finishedAt = new Date();
			if(!taskData.finishedBy) taskData.finishedBy = authReq?.user?._id || null;
		}

		const createdTask = await Task.create(taskData);
		res.status(201).json({ message: 'Task created', task: createdTask });
	} catch (error) {
		console.error("Error creating task:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ message: "Internal server error", error: errorMessage });
	}
};

// GET /api/tasks
export const getTasks = async (_req: Request, res: Response) => {
	try {
		const tasks = await Task.find().populate({
            path: "assignedTo",
			select: "name email", // Select only specific fields to return
        });
		res.status(200).json(tasks);
	} catch (error) {
		console.error("Error fetching tasks:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ message: "Internal server error", error: errorMessage });
	}
};

// GET /api/tasks/:id
export const getTask = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		// Validate the id format
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ message: "Invalid task ID format" });
		}
		const task = await Task.findById(id).populate({
            path: "assignedTo",
			select: "name email", // Select only specific fields to return
        });
		if (!task) {
			return res.status(404).json({ message: "Task not found" });
		}
		res.status(200).json(task);
	} catch (error) {
		console.error("Error fetching task:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ message: "Internal server error", error: errorMessage });
	}
};

// PATCH /api/tasks/:id
export const patchTask = async (req: Request, res: Response) => {
	try {
		const authReq = req as AuthenticatedRequest;
		const taskData: TaskType = req.body;
		const { id } = req.params;

		// Validate input
		const result = ZodTaskSchema.safeParse(taskData);
		if (!result.success) {
			return res.status(400).json({ message: 'Invalid input', error: result.error.issues });
		}

		// Validate the id format
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ message: "Invalid task ID format" });
		}

		// Ensure the task exists
		const existing = await Task.findById(id);
		if (!existing) {
			return res.status(404).json({ message: "Task not found" });
		}

		// Validate assignedTo field if provided
		if (taskData.assignedTo && !mongoose.isValidObjectId(taskData.assignedTo)) {
			return res.status(400).json({ error: "Invalid assignedTo user ID format" });
		}

		// If assignedTo is provided, check that the user exists
		if(taskData.assignedTo) {
			const user = await User.findById(taskData.assignedTo);
			if (!user) {
				return res.status(404).json({ error: "assignedTo user not found" });
			}
		}

		// Set finishedAt and finishedBy if status is 'done'
		if(taskData.status && taskData.status === 'done' && !taskData.finishedBy) {
			if(!taskData.finishedAt) taskData.finishedAt = new Date();
			if(!taskData.finishedBy) taskData.finishedBy = authReq?.user?._id || null;
		}

		// Deep merge the existing task with the patch input
		const mergedData = merge({}, existing.toObject(), taskData);

		// Update the task in the database
		const updatedTask = await Task.findByIdAndUpdate(id, mergedData, {
			new: true,
			runValidators: true,
			upsert: false  // Do not create a new document if it doesn't exist
		});
		if (!updatedTask) {
			return res.status(404).json({ message: "Task not found" });
		}
		res.status(200).json({ message: 'Task updated', task: updatedTask });
	} catch (error) {
		console.error("Error patching task:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ message: "Internal server error", error: errorMessage });
	}
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		// Validate the id format
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ message: "Invalid task ID format" });
		}

		// Delete the task
		const deleted = await Task.findByIdAndDelete(id);
		if (!deleted) {
			return res.status(404).json({ message: "Task not found" });
		}

		res.status(200).json({ message: "Task deleted" });
	} catch (error) {
		console.error("Error deleting task:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ message: "Internal server error", error: errorMessage });
	}
};