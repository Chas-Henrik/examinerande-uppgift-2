// src/index.ts
import config from "./config.js"; // Load config as early as possible
import https from "https";
import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import { connectDB } from "./db.js";
import mongoose from "mongoose";
import helmet from "helmet";
import compression from "compression";

const app = express();

const allowedOrigins = config.isProduction && config.frontendUrl ? [ config.frontendUrl ] : ["http://localhost:3000", "http://localhost:3001"];

console.log("Allowed origins for CORS:", allowedOrigins);

const corsOptions: CorsOptions = {
    origin: allowedOrigins,
    methods: ["POST", "GET", "PUT", "DELETE"],
    optionsSuccessStatus: 200,
    credentials: true,
};

// HTTPS options - in production, use valid certs from a CA
let sslOptions;
try {
  sslOptions = {
    key: fs.readFileSync("./certs/key.pem"),
    cert: fs.readFileSync("./certs/cert.pem")
  };
} catch (err) {
  console.error("Failed to load SSL certificates:", err);
  process.exit(1);
}

// Middleware
app.use(cookieParser()); // !!!Ensure cookie-parser is used before authMiddleware is called!!!
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(compression());

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import taskRoutes from "./routes/task.route.js";
import projectRoutes from "./routes/project.route.js";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes)
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);



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
