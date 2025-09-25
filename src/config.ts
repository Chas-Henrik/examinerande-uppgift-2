// src/config.ts
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
    dbUri: process.env.MONGODB_URI,
    frontendUrl: process.env.FRONTEND_URL,
    jwtSecret: process.env.JWT_SECRET,
    isProduction: process.env.NODE_ENV === 'production',
    ssl: {
        certPath: process.env.SSL_CERT_PATH || "./certs/cert.pem",
        keyPath: process.env.SSL_KEY_PATH || "./certs/key.pem"
    }
};

export default config;
