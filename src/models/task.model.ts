// src/models/task.model.ts

import { max } from "lodash";
import mongoose, { Schema, InferSchemaType } from "mongoose";

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

export type TaskType = InferSchemaType<typeof taskSchema>;

export const Task = mongoose.model("Task", taskSchema);