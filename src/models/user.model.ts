import mongoose, { Schema, InferSchemaType } from "mongoose";

const userSchema = new Schema({
	name: { 
		type: String, 
		required: true,
		trim: true,
		minlength: [2, "Name must be at least 2 characters long"],
		maxlength: [50, "Name must be at most 50 characters long"],
		},
	email: {
        type: String,
        required: true,
		unique: true,
        trim: true,
        lowercase: true,	// this converts to lowercase before saving
        match: [/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/, "Invalid email address"],
    },
	password: { 
		type: String, 
		required: true, 
		minlength: [8, "Encrypted password must be at least 8 characters long"],
	},
});

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = mongoose.model("User", userSchema);
