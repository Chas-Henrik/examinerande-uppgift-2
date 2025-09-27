// src/validation/task.validation.ts
import { z } from "zod";

export const ZodTaskSchema = z.object({
    title: z.coerce
        .string()
        .trim()
        .min(2, "Title must be at least 2 characters long")
        .max(100, "Title must be at most 100 characters long"),
    description: z.coerce
        .string()
        .trim()
        .min(1, "Description must be at least 1 character long")
        .max(500, "Description must be at most 500 characters long")
        .optional(),
    status: z.enum(['to-do', 'in progress', 'blocked', 'done']),
    assignedTo: z.string().optional().nullable(),
    project: z.string().optional().nullable()
}).strict();

export type ZodTaskType = z.infer<typeof ZodTaskSchema>;
export const ZodTaskPatchSchema = ZodTaskSchema.partial();
export type ZodTaskPatchType = z.infer<typeof ZodTaskPatchSchema>;
