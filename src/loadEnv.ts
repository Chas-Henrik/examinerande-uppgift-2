// src/loadEnv.ts
import dotenv from 'dotenv';
import { ZodEnvSchema } from "./validation";

// Load .env file
const result = dotenv.config();

if (result.error) {
    console.error('❌ Failed to load .env file:', result.error);
    process.exit(1);
}

// Validate FRONTEND_URL env variable
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    console.error("❌ Missing required env: FRONTEND_URL");
    process.exit(1);
}

// Validate env variables using Zod
const parsed = ZodEnvSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
    process.exit(1);
}

console.log("✅ Environment variables loaded and validated");

export default parsed.data;