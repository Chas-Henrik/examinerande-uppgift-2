import express from "express"
import { authMiddleware } from "../middleware/authorize.js";
import { createUser, getUsers, getUser, patchUser, deleteUser, getUserTasks } from "../controllers/user.controller.js";

const router = express.Router()

// CRUD for users
router.post("/", authMiddleware, createUser);
router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, getUser);
router.patch("/:id", authMiddleware, patchUser);
router.delete("/:id", authMiddleware, deleteUser);

// Additional routes for users
router.get("/:id/tasks", authMiddleware, getUserTasks); // Example: Get tasks for a specific user

export default router;