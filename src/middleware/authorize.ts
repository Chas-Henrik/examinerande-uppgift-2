// src/middleware/authorize.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js"
import { User } from "../models/user.model.js";
import { UserLevel, AuthUserType } from "../types/user.js";
import mongoose from "mongoose";
import { normalizeUserLevel } from "../utils/user.js";

// Extend Express Request type to include 'user'
export interface AuthenticatedRequest extends Request {
	user: AuthUserType;
}

// Middleware 
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authReq = req as AuthenticatedRequest;

    // Check that req.cookies is defined
    if (!authReq.cookies) {
        res.status(401).json({message: "Unauthorized, missing Cookies header"});
        return;
    }

    const token = authReq.cookies.token;

    if(!token) {
        res.status(401).json({ message: "Unauthorized, expired, missing or invalid JSON Web token"});
        return;
    }

    // Check that token is valid
    try {
        const payload = verifyToken(token);
        authReq.user = payload as AuthUserType;

        // Ensure authReq.user._id is defined
        if (!authReq.user || !authReq.user._id || !mongoose.isValidObjectId(authReq.user._id)) {
            return res.status(401).json({ message: 'Unauthorized, invalid token payload' });
        }

        // Fetch user from DB to ensure the user exists
        const user = await User.findById(authReq.user._id);
        if (!user) {
            return res.status(401).json({message: "Unauthorized, user not found"});
        }

        // Ensure userLevel exists
        if (!user.userLevel) {
            return res.status(401).json({ message: 'Unauthorized, missing user level' });
        }

        // Ensure userLevel is valid enum value
        const level = normalizeUserLevel(user.userLevel);

        if (level === undefined || !Object.values(UserLevel).includes(level)) {
            return res.status(401).json({ message: 'Unauthorized, invalid user level' });
        }

        // Ensure UserLevel is above or equal to DEVELOPER level access
        if (user.userLevel < UserLevel.DEVELOPER) {
            return res.status(403).json({ message: "Forbidden, missing or insufficient user level" });
        }

        next();
    } catch(error) {
        console.error("Error verifying token:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
}
