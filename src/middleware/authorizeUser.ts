// src/middleware/authorizeUser.ts

import { Request, Response, NextFunction } from "express";
import { UserLevel, ApiResponseType } from "../types";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";
import { ApiError } from "../utils";
import { User } from "../models";

type AuthorizeOptions = {
  minUserLevel: UserLevel;  // Minimum required user level
  authOwner?: boolean;      // Whether ownership (req.user._id === req.params.id) access is allowed
};

export function authorizeUser({ minUserLevel, authOwner = false }: AuthorizeOptions) {
  return async (req: Request, _res: Response<ApiResponseType>, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
    
      const userLevelAuthorized = authReq.user.userLevel >= minUserLevel;
      let ownsResource = false;

      if(authOwner) {
          const { id } = req.params;

          // Validate the id format
          if (!mongoose.isValidObjectId(id)) {
            throw new ApiError(400, "Invalid user ID parameter");
          }

          // Check that the user exists
          const userExists = await User.exists({ _id: id });
          if (!userExists) {
              throw new ApiError(404, 'User not found');
          }

          ownsResource = authOwner && id === authReq.user._id;
      }

      // If neither user level nor ownership is authorized, deny access
      if (!(userLevelAuthorized || ownsResource)) {
        throw new ApiError(403, "Forbidden: You do not have permission to access this resource");
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
}

export function authorizeUserDelete() {
  return (req: Request, _res: Response<ApiResponseType>, next: NextFunction) => {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;

      // admins cannot delete themselves (to guarantee at least one admin user exists)
      if (authReq.user._id === id && authReq.user.userLevel === UserLevel.ADMIN) {
        throw new ApiError(403, "Forbidden, admin users cannot delete themselves");
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
}
