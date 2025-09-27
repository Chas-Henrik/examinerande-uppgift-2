// src/middleware/authorizeUser.ts

import { Request, Response, NextFunction } from "express";
import { UserLevel } from "../types";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";

type AuthorizeOptions = {
  minUserLevel: UserLevel;  // Minimum required user level
  authOwner?: boolean;      // Whether ownership (req.user._id === req.params.id) access is allowed
};

export function authorizeUser({ minUserLevel, authOwner = false }: AuthorizeOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    const userLevelAuthorized = authReq.user.userLevel >= minUserLevel;
    let ownsResource = false;

    if(authOwner) {
        const { id } = req.params;

        // Validate the id format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ ok: false, message: "Invalid user ID format" });
        }

        ownsResource = authOwner && id === authReq.user._id;
    }

    // If neither user level nor ownership is authorized, deny access
    if (!(userLevelAuthorized || ownsResource)) {
      return res.status(403).json({
        ok: false,
        message: "Forbidden: You do not have permission to access this resource",
      });
    }

    return next();
  };
}

