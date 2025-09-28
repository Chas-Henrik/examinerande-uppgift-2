// src/models/project.model.ts

import mongoose, { InferSchemaType, Types } from "mongoose";

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [100, "Name must be at most 100 characters long"],
        unique: true,
        index: true,    // make sure index is created to enforce uniqueness
    },
    description: {
        type: String,
        default: '',
        maxlength: [500, "Description must be at most 500 characters long"],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
},
{
    timestamps: true,
});

type ProjectBaseType = InferSchemaType<typeof projectSchema>;
export type ProjectType = ProjectBaseType & { _id: Types.ObjectId };
export type ProjectJSONType = Partial<ProjectBaseType> & { _id: string };

export const serializeProject = (project: ProjectType): ProjectJSONType => ({
	_id: project._id.toString(),
	name: project.name,
	description: project.description,
	owner: project.owner,
	createdAt: project.createdAt,
	updatedAt: project.updatedAt
});

export const Project = mongoose.model("Project", projectSchema);
