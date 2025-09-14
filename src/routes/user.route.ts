import express from "express"
import { authMiddleware } from "../middleware/authorize.js";
import { getUsers, getUser, patchUser, deleteUser } from "../controllers/user.controller.js";

const router = express.Router()

// CRUD for users
router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, getUser);
router.patch("/:id", authMiddleware, patchUser);
router.delete("/:id", authMiddleware, deleteUser);


export default router;