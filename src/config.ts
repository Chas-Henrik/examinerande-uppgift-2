// src/config.ts

const config = {
    port: process.env.PORT || 3000,
    dbUri: process.env.MONGODB_URI,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    jwtSecret: process.env.JWT_SECRET,
    isProduction: process.env.NODE_ENV === 'production',
    ssl: {
        certPath: process.env.SSL_CERT_PATH || "./certs/cert.pem",
        keyPath: process.env.SSL_KEY_PATH || "./certs/key.pem"
    }
};

if(config.isProduction) {
    if(!config.frontendUrl) {
        throw new Error("FRONTEND_URL is required in production");
    }
}

export default config;
