// src/validation/env.validation.ts

import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().url().startsWith('mongodb'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET should be at least 32 characters'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production']),
  SSL_CERT_PATH: z.string().nonempty().optional(),
  SSL_KEY_PATH: z.string().nonempty().optional(),
});

export const ZodEnvSchema = envSchema.partial();
export type ZodEnvType = z.infer<typeof ZodEnvSchema>;
