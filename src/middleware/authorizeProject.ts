// src/middleware/authorizeProject.ts

import { Request, Response, NextFunction } from "express";
import { UserLevel, ApiResponseType } from "../types";
import { AuthenticatedRequest } from "../middleware";
import { Project } from '../models';

export function authorizeProject(minUserLevel: UserLevel) {
  return async (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;

    // Ensure the project exists
    const project = await Project.findById(id);
    if (!project) {
        return res.status(404).json({ ok: false, message: "Project not found" });
    }

    // Ensure the authenticated user is the current owner or admin user
    if (project.owner && project.owner.toString() !== authReq.user._id) {
        if (authReq.user.userLevel < minUserLevel) {
            return res.status(403).json({ ok: false, message: `Forbidden, only the owner or ${UserLevel[minUserLevel]} can update or delete this project` });
        }
    }

    return next();
  };
}

