// src/index.ts

import "./loadEnv.js"; // Always first
import config from "./config.js"; 
import https from "https";
import fs from "fs";
import express from "express";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import { connectDB } from "./db.js";
import mongoose from "mongoose";
import helmet from "helmet";
import compression from "compression";
import routes from "./routes/index.js";
import { errorHandler } from './middleware';

const app = express();

console.log("Allowed origins for CORS:", config.frontendUrl);

const corsOptions: CorsOptions = {
    origin: [ config.frontendUrl ],
    methods: ["POST", "GET", "PUT", "DELETE"],
    optionsSuccessStatus: 200,
    credentials: true,
};

// HTTPS options - in production, use valid certs from a CA
let sslOptions;
try {
  sslOptions = {
    key: fs.readFileSync(config.ssl.keyPath),
    cert: fs.readFileSync(config.ssl.certPath)
  };
} catch (err) {
  console.error("Failed to load SSL certificates:", err);
  process.exit(1);
}

// Middleware
app.use(cookieParser()); // !!!Ensure cookie-parser is used before authenticate is called!!!
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(compression());

app.use("/api", routes);  // Prefix all routes with /api
app.use(errorHandler);    // Centralized error handling middleware

await connectDB()
	.then(() => {
		const PORT = config.port;
		if (config.isProduction) {
			https.createServer(sslOptions, app).listen(PORT, () => {
				console.log("HTTPS Server running on port: ", PORT);
			});
		} else {
			app.listen(PORT, () => {
				console.log("HTTP Server running on port: ", PORT);
			});
		}
	})
	.catch((err) => {
		console.log("Error connecting to MongoDB");
	});

process.on("SIGINT", async () => {
  try {
    console.log("Shutting down gracefully...");
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
});
