// src/controllers/project.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User, Task, Project, ProjectType } from '../models';
import { UserLevel, ProjectApiResponse, TaskApiResponse } from '../types';
import { ZodProjectSchema, ZodProjectPatchSchema, ZodProjectPatchType } from '../validation';
import { AuthenticatedRequest } from "../middleware";
import { formatZodError } from '../utils';

// POST /api/projects
export const createProject = async (req: Request, res: Response<ProjectApiResponse>) =>  {
	try {
		const authReq = req as AuthenticatedRequest;
		const projectData: Omit<ProjectType, 'owner'> = req.body;

		// Validate input
		const result = ZodProjectSchema.safeParse(projectData);
		if (!result.success) {
			return res.status(400).json({ 
				ok: false, 
				message: 'Invalid input', 
				error: formatZodError(result.error) 
			});
		}

		const createdProject = await Project.create({ ...projectData, owner: authReq.user._id });
		res.status(201).json({ ok: true, message: 'Project created', project: createdProject });
	} catch (error) {
		console.error("Error creating project:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};

// GET /api/projects
export const getProjects = async (_req: Request, res: Response<ProjectApiResponse>) => {
	try {
		const projects = await Project.find().lean().populate({
            path: "owner",
			select: "name email", // Select only specific fields to return
        });
		res.status(200).json({ ok: true, projects: projects });
	} catch (error) {
		console.error("Error fetching projects:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};

// GET /api/projects/:id
export const getProject = async (req: Request, res: Response<ProjectApiResponse>) => {
	try {
		const { id } = req.params;
		// Validate the id format
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ ok: false, message: "Invalid project ID format" });
		}

        // Fetch the project and populate the owner field
		const project = await Project.findById(id).lean().populate({
            path: "owner",
			select: "name email", // Select only specific fields to return
        });

        // Check if the project exists
		if (!project) {
			return res.status(404).json({ ok: false, message: "Project not found" });
		}

		res.status(200).json({ ok: true, project: project });
	} catch (error) {
		console.error("Error fetching project:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};

// PATCH /api/projects/:id
export const patchProject = async (req: Request, res: Response<ProjectApiResponse>) => {
	try {
        const authReq = req as AuthenticatedRequest;
		const projectData: ProjectType = req.body;
		const { id } = req.params;

		// Validate input
		const result = ZodProjectPatchSchema.safeParse(projectData);
		if (!result.success) {
			return res.status(400).json({ 
				ok: false, 
				message: 'Invalid input', 
				error: formatZodError(result.error)
			});
		}

		const patchData: ZodProjectPatchType = result.data;

		// Validate the id format
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ ok: false, message: "Invalid project ID format" });
		}

		// Ensure the project exists
		const existing = await Project.findById(id);
		if (!existing) {
			return res.status(404).json({ ok: false, message: "Project not found" });
		}

		// Ensure the authenticated user is the current owner or admin user
		if (existing.owner && existing.owner.toString() !== authReq.user._id) {
			if (authReq.user.userLevel < UserLevel.ADMIN) {
				return res.status(403).json({ ok: false, message: "Forbidden, only the owner or an admin can update this project" });
			}
		}

        // Validate owner field if provided
		if (patchData.owner && !mongoose.isValidObjectId(patchData.owner)) {
			return res.status(400).json({ ok: false, message: "Invalid owner user ID format" });
		}

		// If owner is provided, check that the user exists
		if (patchData.owner) {
			const user = await User.findById(patchData.owner);
			if (!user) {
				return res.status(404).json({ ok: false, message: "Owner user not found" });
			}
		}

		// Update the project in the database
		const updatedProject = await Project.findByIdAndUpdate(id, patchData, {
			new: true,
			runValidators: true,
			upsert: false  // Do not create a new document if it doesn't exist
		});
		if (!updatedProject) {
			return res.status(404).json({ ok: false, message: "Project not found" });
		}
		res.status(200).json({ ok: true, message: 'Project updated', project: updatedProject });
	} catch (error) {
		console.error("Error patching project:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};

// DELETE /api/projects/:id
export const deleteProject = async (req: Request, res: Response<ProjectApiResponse>) => {
	try {
        const authReq = req as AuthenticatedRequest;
		const { id } = req.params;

		// Validate the id format
		if (!mongoose.isValidObjectId(id)) {
			return res.status(400).json({ ok: false, message: "Invalid project ID format" });
		}

        // Ensure the project exists
        const project = await Project.findById(id);
		if (!project) {
			return res.status(404).json({ ok: false, message: "Project not found" });
		}

        // Ensure the authenticated user is the current owner or admin user
		if (project.owner && project.owner.toString() !== authReq.user._id) {
			if (authReq.user.userLevel < UserLevel.ADMIN) {
				return res.status(403).json({ ok: false, message: "Forbidden, only admins or the project owner can delete this project" });
			}
		}

		// Delete the project
		const deleted = await Project.findByIdAndDelete(id);
		if (!deleted) {
			return res.status(404).json({ ok: false, message: "Project not found" });
		}

		res.status(200).json({ ok: true, message: "Project deleted" });
	} catch (error) {
		console.error("Error deleting project:", error);
		const errorMessage = (error instanceof Error) ? error.message : String(error);
		res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
	}
};

// GET /api/projects/:id/tasks
export const getProjectTasks = async (req: Request, res: Response<TaskApiResponse>) => {
    try {
        const { id } = req.params;

        // Validate the id format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ ok: false, message: "Invalid project ID format" });
        }

        // Check if the project exists
		const projectExists = await Project.exists({ _id: id });
		if (!projectExists) {
			return res.status(404).json({ ok: false, message: "Project not found" });
		}

		const tasks = await Task.find({ project: id }).populate([
			{
				path: "assignedTo",
				select: "name email"
			},
			{
				path: "finishedBy",
				select: "name email"
			}
		]);

		res.status(200).json({ ok: true, tasks: tasks });
    } catch (error) {
        console.error("Error fetching project tasks:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ ok: false, message: "Internal server error", error: errorMessage });
    }
};
