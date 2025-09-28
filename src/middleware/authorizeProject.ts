// src/middleware/authorizeProject.ts

import { Request, Response, NextFunction } from "express";
import { UserLevel, ApiResponseType } from "../types";
import { AuthenticatedRequest } from "../middleware";
import { Project } from '../models';
import { ApiError } from "../utils";

export function authorizeProject(minUserLevel: UserLevel) {
  return async (req: Request, _res: Response<ApiResponseType>, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      // Ensure the project exists
      const project = await Project.findById(id);
      if (!project) {
        throw new ApiError(404, "Project not found");
      }

      // Ensure the authenticated user is the current owner or admin user
      if (project.owner && project.owner.toString() !== authReq.user._id) {
          if (authReq.user.userLevel < minUserLevel) {
              throw new ApiError(403, `Forbidden, only the owner or ${UserLevel[minUserLevel]} can update or delete this project`);
          }
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
}

