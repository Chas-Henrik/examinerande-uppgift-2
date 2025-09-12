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
    }
},
{
    timestamps: true,
    collection: "products",
});


export type Task = InferSchemaType<typeof taskSchema>;

export const TaskModel = mongoose.model("Task", taskSchema);