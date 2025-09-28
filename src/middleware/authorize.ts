// src/middleware/authorize.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken, normalizeUserLevel } from "../utils"
import { User } from "../models";
import { UserLevel, AuthUserType, ApiResponseType } from '../types';
import mongoose from "mongoose";

// Extend Express Request type to include 'user'
export interface AuthenticatedRequest extends Request {
	user: AuthUserType;
}

// Middleware 
export async function authMiddleware(req: Request, res: Response<ApiResponseType>, next: NextFunction) {
    const authReq = req as AuthenticatedRequest;

    // Check that req.cookies is defined
    if (!authReq.cookies) {
        return res.status(401).json({ ok: false, message: "Not authenticated, missing Cookies header"});
    }

    const token = authReq.cookies.token;

    if(!token) {
        // No token found — probably cookie expired
        console.error("No token found — probably cookie expired");
        return res.status(401).json({ ok: false, message: "Not authenticated" });
    }

    // Check that token is valid
    try {
        // Verify token and attach payload to authReq.user
        try {
            const payload = verifyToken(token);
            authReq.user = payload as AuthUserType;
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === "TokenExpiredError") {
                    return res.status(401).json({ ok: false, message: "JWT token expired" });
                } else {
                    return res.status(401).json({ ok: false, message: "Invalid JWT token" });
                }
            } else {
                return res.status(500).json({ ok: false, message: "Internal server error", errors: [ {error: String(err)} ] });
            }
        }

        // Ensure authReq.user._id is defined
        if (!authReq.user || !authReq.user._id || !mongoose.isValidObjectId(authReq.user._id)) {
            return res.status(401).json({ ok: false, message: 'Unauthorized, invalid token payload' });
        }

        // Fetch user from DB to ensure the user exists
        const user = await User.findById(authReq.user._id);
        if (!user) {
            return res.status(401).json({ ok: false, message: "Unauthorized, user not found" });
        }

        // Ensure userLevel exists
        if (!user.userLevel) {
            return res.status(401).json({ ok: false, message: 'Unauthorized, missing user level' });
        }

        // Ensure userLevel is valid enum value
        const level = normalizeUserLevel(user.userLevel);

        if (level === undefined || !Object.values(UserLevel).includes(level)) {
            return res.status(401).json({ ok: false, message: 'Unauthorized, invalid user level' });
        }

        // Ensure UserLevel is above or equal to DEVELOPER level access
        if (user.userLevel < UserLevel.DEVELOPER) {
            return res.status(403).json({ ok: false, message: "Forbidden, missing or insufficient user level" });
        }

        next();
    } catch(error) {
        console.error("Error verifying token:", error);
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        res.status(500).json({ ok: false, message: "Internal server error", errors: [{ error: errorMessage }] });
    }
}
