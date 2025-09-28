// src/models/task.model.ts

import mongoose, { InferSchemaType, Types } from "mongoose";

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, "Title must be at least 2 characters long"],
        maxlength: [100, "Title must be at most 100 characters long"],
    },
    description: {
        type: String,
        default: '',
        maxlength: [500, "Description must be at most 500 characters long"],
    },
    status: {
        type: String,
        enum: ['to-do', 'in progress', 'blocked', 'done'],
        default: 'to-do',
        required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null,
    },
    finishedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    finishedAt : {
        type: Date,
        default: null,
    }
},
{
    timestamps: true,
});

type TaskBaseType = InferSchemaType<typeof taskSchema>;
export type TaskType = TaskBaseType & { _id: Types.ObjectId };
export type TaskJSONType = Partial<TaskBaseType> & { _id: string };

export const serializeTask = (task: TaskType): TaskJSONType => ({
	_id: task._id.toString(),
	title: task.title,
	description: task.description,
	status: task.status,
	assignedTo: task.assignedTo,
	project: task.project,
	finishedBy: task.finishedBy,
	finishedAt: task.finishedAt,
	createdAt: task.createdAt,
	updatedAt: task.updatedAt
});

export const Task = mongoose.model("Task", taskSchema);