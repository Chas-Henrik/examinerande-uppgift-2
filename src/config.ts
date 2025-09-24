import dotenv from 'dotenv';

const result = dotenv.config();

if (result.error) {
    console.error('Failed to load .env file:', result.error);
    process.exit(1);
}

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    throw new Error("Missing required env: FRONTEND_URL");
}

if (!process.env.JWT_SECRET) {
    throw new Error("Missing required env: JWT_SECRET");
}

const config = {
    port: process.env.PORT || 3000,
    frontendUrl: process.env.FRONTEND_URL,
    jwtSecret: process.env.JWT_SECRET,
    isProduction: process.env.NODE_ENV === 'production',
};

export default config;
