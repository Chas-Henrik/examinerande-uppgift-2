// src/utils/zod.ts
import { ZodError } from "zod";

export const formatZodError = (error: ZodError) => error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
