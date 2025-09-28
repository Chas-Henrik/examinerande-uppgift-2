// src/middleware/authorize.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken, normalizeUserLevel, ApiError } from "../utils"
import { User } from "../models";
import { UserLevel, AuthUserType, ApiResponseType } from '../types';
import mongoose from "mongoose";

// Extend Express Request type to include 'user'
export interface AuthenticatedRequest extends Request {
	user: AuthUserType;
}

// Middleware to authenticate and authorize users based on JWT token and user level
export async function authenticate(req: Request, _res: Response<ApiResponseType>, next: NextFunction) {
    try {
        const authReq = req as AuthenticatedRequest;

        // Check that req.cookies is defined
        if (!authReq.cookies) {
            throw new ApiError(401, "Not authenticated, missing Cookies header");
        }

        // Check that token is valid
        const token = authReq.cookies.token;

        if(!token) {
            // No token found — probably cookie expired
            console.error("No token found — probably cookie expired");
            throw new ApiError(401, "Not authenticated, missing token");
        }

        // Verify token and attach payload to authReq.user
        try {
            const payload = verifyToken(token);
            authReq.user = payload as AuthUserType;
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === "TokenExpiredError") {
                    throw new ApiError(401, "JWT token expired");
                } else {
                    throw new ApiError(401, "Invalid JWT token");
                }
            } else {
                throw new ApiError(500, "Internal server error");
            }
        }

        // Ensure authReq.user._id is defined
        if (!authReq.user || !authReq.user._id || !mongoose.isValidObjectId(authReq.user._id)) {
            throw new ApiError(401, 'Unauthorized, invalid token payload');
        }

        // Fetch user from DB to ensure the user exists
        const user = await User.findById(authReq.user._id);
        if (!user) {
            throw new ApiError(401, "Unauthorized, user not found");
        }

        // Ensure userLevel exists
        if (!user.userLevel) {
            throw new ApiError(401, 'Unauthorized, missing user level');
        }

        // Ensure userLevel is valid enum value
        const level = normalizeUserLevel(user.userLevel);

        if (level === undefined || !Object.values(UserLevel).includes(level)) {
            throw new ApiError(401, 'Unauthorized, invalid user level');
        }

        // Ensure UserLevel is above or equal to DEVELOPER level access
        if (user.userLevel < UserLevel.DEVELOPER) {
            throw new ApiError(403, "Forbidden, missing or insufficient user level");
        }

        next();
    } catch(error) {
        next(error);
    }
}
