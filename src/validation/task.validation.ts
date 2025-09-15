import { z } from "zod";

export const ZodTaskSchema = z.object({
    title: z.coerce
        .string()
        .trim()
        .min(2, "Title must be at least 2 characters long")
        .max(100, "Title can't be more than 100 characters long")
        .optional(),
    description: z.coerce
        .string()
        .trim()
        .max(500, "Description can't be more than 500 characters long")
        .optional(),
    status: z.enum(['to-do', 'in progress', 'blocked', 'done']).optional(),
    assignedTo: z.string().optional().nullable()
});

