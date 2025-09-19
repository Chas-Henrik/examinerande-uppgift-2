import { z } from "zod";
import { UserLevel } from "../types/user.js";

export const ZodUserSchema = z.object({
    name: z.coerce
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name must be at most 50 characters long")
        .optional(),
    email: z.string()
        .trim()
        .toLowerCase()
        .email("Invalid email address")
        .optional(),
    password: z.coerce
        .string()
        .min(8, "Password must be at least 8 characters long")
        .optional(),
    userLevel: z.enum(Object.values(UserLevel) as string[]).optional()
});

