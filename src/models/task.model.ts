// src/models/task.model.ts

import mongoose, { Schema, InferSchemaType } from "mongoose";

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
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
    finishedAt : {
        type: Date,
        default: null,
    }
},
{
    timestamps: true,
});

// Set finishedAt to current date when status is set to 'done'
taskSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        if(this.status === 'done' && !this.finishedAt) {
            this.finishedAt = new Date();
        }
    }
    next();
});

// ✅ Pre-save hook (runs on .save())
taskSchema.pre('save', function (next) {
    // Set finishedAt to current date when status is set to 'done'
    if (this.isModified('status') && this.status === 'done' && !this.finishedAt) {
        this.finishedAt = new Date();
    }
    next();
});

// ✅ Pre-update hook (runs on findByIdAndUpdate, findOneAndUpdate)
taskSchema.pre('findOneAndUpdate', function (next) {
    // Set finishedAt to current date when status is set to 'done'
    const update = this.getUpdate() as { [key: string]: any };
    
    if (!update) return next();

    if (update.status && update.status === 'done' && !update.finishedAt) {
        update.finishedAt = new Date();
        this.setUpdate(update);
    }
    next();
});

export type TaskType = InferSchemaType<typeof taskSchema>;

export const Task = mongoose.model("Task", taskSchema);