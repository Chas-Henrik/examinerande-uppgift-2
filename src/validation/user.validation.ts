// src/validation/user.validation.ts
import { z } from "zod";
import { UserLevel } from "../types/user.js";

export const ZodUserSchema = z.object({
    name: z.coerce
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name must be at most 50 characters long"),
    email: z.string()
        .trim()
        .toLowerCase()
        .email("Invalid email address"),
    password: z.coerce
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(100, "Password must be at most 100 characters long"),
    userLevel: z.enum(Object.values(UserLevel) as string[])
}).strict();

export type ZodUserType = z.infer<typeof ZodUserSchema>;
export const ZodUserPatchSchema = ZodUserSchema.partial();
export type ZodUserPatchType = z.infer<typeof ZodUserPatchSchema>;

export const ZodLoginSchema = z.object({
    email: z.string()
        .trim()
        .toLowerCase()
        .email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .max(100, "Password must be at most 100 characters long")
}).strict();

export type ZodLoginSchemaType = z.infer<typeof ZodLoginSchema>;