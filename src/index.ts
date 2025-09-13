import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import { connectDB } from "./db.js";

dotenv.config();

const app = express();

const corsOptions: CorsOptions = {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["POST", "GET", "PUT", "DELETE"],
    optionsSuccessStatus: 200,
    credentials: true,
};

// Middleware
app.use(cookieParser()); // !!!Ensure cookie-parser is used before authMiddleware is called!!!
app.use(cors(corsOptions));
app.use(express.json());


import authRoutes from "./routes/auth.route.js";
// import userRoutes from "./routes/user.route.js";
import taskRoutes from "./routes/task.route.js";

app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes)
app.use("/api/tasks", taskRoutes);


await connectDB()
	.then(() => {
		const PORT = 3000;
		app.listen(PORT, () => {
			console.log("Server running on port: ", PORT);
		});
	})
	.catch((err) => {
		console.log("Error connecting to MongoDB");
	});