// src/middleware/validationMiddleware.ts

import { Request, Response, NextFunction } from "express";
import { ApiResponseType } from "../types";
import { ZodPaginationSchema, ZodPaginationType } from "../validation";
import { ApiError } from "../utils";
import mongoose from "mongoose";


export function validatePagination() {
    return async (req: Request, _res: Response<ApiResponseType>, next: NextFunction) => {
        try {
            const { page = '1', size = '10' } = req.query;
            const pageNum = parseInt(page as string);
            const sizeNum = parseInt(size as string);
            const validatedPagination: ZodPaginationType = ZodPaginationSchema.parse({ page: pageNum, size: sizeNum });
            if (!validatedPagination) {
                throw new ApiError(400, 'Invalid pagination parameters');
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

export function validateId() {
    return async (req: Request, _res: Response<ApiResponseType>, next: NextFunction) => {
        try {
            const { id } = req.params;
            if (!id || !mongoose.isValidObjectId(id)) {
                throw new ApiError(400, 'Invalid ID parameter');
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};
