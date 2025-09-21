// src/validation/task.validation.ts
import { z } from "zod";

export const ZodTaskSchema = z.object({
    title: z.coerce
        .string()
        .trim()
        .min(2, "Title must be at least 2 characters long")
        .max(100, "Title must be at most 100 characters long")
        .optional(),
    description: z.coerce
        .string()
        .trim()
        .max(500, "Description must be at most 500 characters long")
        .optional(),
    status: z.enum(['to-do', 'in progress', 'blocked', 'done']).optional(),
    assignedTo: z.string().optional().nullable()
});

