// src/validation/params.validation.ts
import { z } from "zod";

export const ZodPaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    size: z.coerce.number().int().positive().max(100).default(10), // Limit size to max 100
});

export type ZodPaginationType = z.infer<typeof ZodPaginationSchema>;