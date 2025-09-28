// src/utils/async.ts

import { Request, Response, NextFunction } from "express";
import { ApiResponseType } from "../types";

interface AsyncHandlerFn {
    (req: Request, res: Response<ApiResponseType>, next: NextFunction): Promise<any>;
}

export function asyncHandler(fn: AsyncHandlerFn) {
    return (req: Request, res: Response<ApiResponseType>, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);    // Pass errors to the next middleware (error handler)
    }
}