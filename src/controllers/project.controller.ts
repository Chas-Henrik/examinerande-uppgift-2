// src/controllers/project.controller.ts
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User, Task, Project, ProjectType, serializeProject, serializeTask } from '../models';
import { ApiResponseType } from '../types';
import { ZodProjectSchema, ZodProjectPatchSchema, ZodProjectType, ZodProjectPatchType } from '../validation';
import { AuthenticatedRequest } from "../middleware";
import { ApiError, ensureValidObjectId } from '../utils';

// POST /api/projects
export const createProject = async (req: Request, res: Response<ApiResponseType>, next: NextFunction) =>  {
	const authReq = req as AuthenticatedRequest;
	const projectData: Omit<ProjectType, 'owner'> = req.body;

	// Validate input
	const validatedProject: ZodProjectType =  ZodProjectSchema.parse(projectData);

	const createdProject = await Project.create({ ...validatedProject, owner: authReq.user._id });
	res.status(201).json({ ok: true, message: 'Project created', data: serializeProject(createdProject) });
};

// GET /api/projects
export const getProjects = async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
	const { page = '1', size = '10' } = req.query;
	const pageNum = parseInt(page as string);
	const sizeNum = parseInt(size as string);

	const skip = (pageNum - 1) * sizeNum;

	const projects = await Project.find().lean().skip(skip).limit(sizeNum).populate({
		path: "owner",
		select: "name email", // Select only specific fields to return
	});
	res.status(200).json({ ok: true, message: 'Projects fetched', data: projects.map(project => serializeProject(project)) });
};

// GET /api/projects/:id
export const getProject = async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
	const { id } = req.params;

	// Fetch the project and populate the owner field
	const project = await Project.findById(id).lean().populate({
		path: "owner",
		select: "name email", // Select only specific fields to return
	});

	// Check if the project exists
	if (!project) {
		throw new ApiError(404, 'Project not found');
	}

	res.status(200).json({ ok: true, message: 'Project fetched', data: serializeProject(project) });
};

// PATCH /api/projects/:id
export const patchProject = async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
	const projectData: ProjectType = req.body;
	const { id } = req.params;

	// Validate input
	const validatedProject: ZodProjectPatchType = ZodProjectPatchSchema.parse(projectData);

	// Validate owner field if provided
	if (validatedProject.owner) {
		ensureValidObjectId(validatedProject.owner, 'owner user ID');
	}

	// If owner is provided, check that the user exists
	if (validatedProject.owner) {
		const user = await User.findById(validatedProject.owner);
		if (!user) {
			throw new ApiError(404, 'Owner user not found');
		}
	}

	// Update the project in the database
	const updatedProject = await Project.findByIdAndUpdate(id, validatedProject, {
		new: true,
		runValidators: true,
		upsert: false  // Do not create a new document if it doesn't exist
	}).lean();
	if (!updatedProject) {
		throw new ApiError(404, 'Project not found');
	}
	res.status(200).json({ ok: true, message: 'Project updated', data: serializeProject(updatedProject) });
};

// DELETE /api/projects/:id
export const deleteProject = async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
	const { id } = req.params;

	// Delete the project
	const deleted = await Project.findByIdAndDelete(id);
	if (!deleted) {
		throw new ApiError(404, 'Project not found');
	}

	res.status(200).json({ ok: true, message: "Project deleted" });
};

// GET /api/projects/:id/tasks
export const getProjectTasks = async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
	const { id } = req.params;

	// Check if the project exists
	const projectExists = await Project.exists({ _id: id });
	if (!projectExists) {
		throw new ApiError(404, 'Project not found');
	}

	const tasks = await Task.find({ project: id }).lean().populate([
		{
			path: "assignedTo",
			select: "name email"
		},
		{
			path: "finishedBy",
			select: "name email"
		}
	]);

	res.status(200).json({ ok: true, message: 'Tasks fetched', data: tasks.map(task => serializeTask(task)) });
};
