// src/models/user.model.ts

import mongoose, { Schema, InferSchemaType, Types } from "mongoose";
import bcrypt from "bcrypt"
import { UserLevel } from "../types/user.js"

const numericEnumValues = Object.values(UserLevel).filter(v => typeof v === 'number');

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
		index: true,    // make sure index is created to enforce uniqueness!
        trim: true,
        lowercase: true,	// This converts to lowercase before saving
        match: [/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/, "Invalid email address"],
    },
	password: { 
		type: String,
		required: true, 
		minlength: [8, "Password must be at least 8 characters long"],
		select: false,		// Avoid accidental exposure of password
	},
	userLevel: {
		type: Number,
		enum: numericEnumValues, // This ensures only valid enum values are accepted
		default: UserLevel.NONE,
		required: true
	}
}, 
{ 
	timestamps: true,
});

// ✅ Pre-save hook (runs on .save())
userSchema.pre('save', async function (next) {
	// Hash password before save
	if (this.isModified('password')) {
		//Don't rehash if already hashed
		if (typeof this.password === 'string' && !this.password.startsWith('$2b$')) {
			this.password = await bcrypt.hash(this.password, 10);
		}
	}
	next();
});

// ✅ Pre-update hook (runs on findByIdAndUpdate, findOneAndUpdate)
userSchema.pre('findOneAndUpdate', async function (next) {
	// Hash password before findByIdAndUpdate, findOneAndUpdate
	const update = this.getUpdate() as { [key: string]: any };
	
	if (!update) return next();

	if (update.password && typeof update.password === 'string' && !update.password.startsWith('$2b$')) {
		update.password = await bcrypt.hash(update.password, 10);
		this.setUpdate(update);
	}
	next();
});

type UserBaseType = InferSchemaType<typeof userSchema>;
export type UserType = UserBaseType & { _id: Types.ObjectId };
export type UserJSONType = Partial<UserBaseType> & { _id: string };

export const serializeUser = (user: UserType): UserJSONType => ({
	_id: user._id.toString(),
	name: user.name,
	email: user.email,
	userLevel: user.userLevel,
	createdAt: user.createdAt,
	updatedAt: user.updatedAt
});

export const User = mongoose.model("User", userSchema);
