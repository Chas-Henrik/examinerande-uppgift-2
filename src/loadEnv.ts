// src/loadEnv.ts

import dotenv from 'dotenv';
import dotenvExpand from "dotenv-expand";
import { ZodEnvSchema } from "./validation";
import { formatZodError } from './utils/zod.js';  // Don't use './utils' here to avoid importing config.ts from jwt.ts

// Load .env file
const env = dotenv.config();

if (env.error) {
    console.error('❌ Failed to load .env file:', env.error);
    process.exit(1);
}

// Expand variables like ${VAR} in .env
dotenvExpand.expand(env);

// Validate env variables using Zod
const parsed = ZodEnvSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', formatZodError(parsed.error));
    process.exit(1);
}

console.log("✅ Environment variables loaded and validated");

export default parsed.data;