// src/routes/index.ts
import express from "express";

// Import individual routers
import authRoutes from "./auth.route.js";
import healthRoutes from "./health.route.js";
import projectRoutes from "./project.route.js";
import taskRoutes from "./task.route.js";
import userRoutes from "./user.route.js";

const router = express.Router();

// Mount routers under appropriate base paths
router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/users", userRoutes);

export default router;