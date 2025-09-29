// src/utils/validateObjectId.ts

import mongoose from 'mongoose';
import { ApiError } from './index'; // adjust path if ApiError is elsewhere

export function ensureValidObjectId(id: unknown, name = 'id') {
  if (!id || typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${name}`);
  }
}
