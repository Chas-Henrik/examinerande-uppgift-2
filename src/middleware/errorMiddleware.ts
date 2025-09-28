// src/middleware/errorMiddleware.ts

import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { ApiResponseType } from '../types';
import { ApiError } from '../utils';

export function errorHandler(err: any, req: Request, res: Response<ApiResponseType>, _next: NextFunction) {
  let statusCode: number;
  let message: string;
  let errors: object[] = [];

  if (err instanceof ApiError) {
    // Handle API errors
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    // Handle Zod validation errors
    statusCode = 400;
    message = 'Parameter validation error';
    errors = err.issues.map(e => ({
      parameter: e.path.join('.'),
      message: e.message
    }));
  } else if (err instanceof mongoose.Error.ValidationError) {
    // Handle Mongoose validation errors
    statusCode = 400;
    message = 'Database validation error';
    errors = Object.values(err.errors).map(e => ({
      message: e.message
    }));
  } else if(err instanceof mongoose.Error.CastError) {
    // Handle Mongoose cast errors (e.g., invalid ObjectId)
    statusCode = 400;
    message = 'Invalid parameter format';
    errors = [{ message: err.message }];
  } else if (err.code === 11000) {
    // Handle duplicate key error (e.g., unique fields)
    statusCode = 409;
    message = 'Duplicate key error';
    errors = [{ message: `Duplicate field: ${Object.keys(err.keyValue).join(', ')}` }];
  } else {
    // Handle other errors
    statusCode = err.statusCode || 500;
    message = "Internal server error";
    errors = (err instanceof Error) ? [{ message: err.message }] : [{ message: String(err) }];
  }

  res.status(statusCode).json({
    ok: false,
    message: message,
    errors: errors.length > 0 ? errors : undefined
  });
}
