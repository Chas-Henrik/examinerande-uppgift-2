import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import { connectDB } from "./db.js";
import mongoose from "mongoose";
import helmet from "helmet";
import compression from "compression";

const result = dotenv.config();

if (result.error) {
	console.error('Failed to load .env file:', result.error);
	process.exit(1);
}

const app = express();

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL?.toString() || ""]
  : ["http://localhost:3000", "http://localhost:3001"];

const corsOptions: CorsOptions = {
    origin: allowedOrigins,
    methods: ["POST", "GET", "PUT", "DELETE"],
    optionsSuccessStatus: 200,
    credentials: true,
};

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
		const PORT = process.env.PORT || 3000;
		app.listen(PORT, () => {
			console.log("Server running on port: ", PORT);
		});
	})
	.catch((err) => {
		console.log("Error connecting to MongoDB");
	});

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await mongoose.disconnect();
  process.exit(0);
});
