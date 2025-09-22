// src/routes/task.route.ts
import express from "express"
import { createTask, getTasks, getTask, patchTask, deleteTask } from "../controllers/task.controller.js";
import { authMiddleware } from "../middleware/authorize.js";

const router = express.Router()

// CRUD for tasks
router.post("/", authMiddleware, createTask);
router.get("/", authMiddleware, getTasks);
router.get("/:id", authMiddleware, getTask);
router.patch("/:id", authMiddleware, patchTask);
router.delete("/:id", authMiddleware, deleteTask);

export default router;