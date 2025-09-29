// src/routes/task.route.ts

import express from "express"
import { authenticate, generalLimiter, validatePagination, validateId } from "../middleware";
import { TaskController } from '../controllers';

const router = express.Router()

router.use(generalLimiter);

// CRUD for tasks
router.post("/", authenticate(), TaskController.createTask);
router.get("/", authenticate(), validatePagination(), TaskController.getTasks);
router.get("/:id", validateId(), authenticate(), TaskController.getTask);
router.patch("/:id", validateId(), authenticate(), TaskController.patchTask);
router.delete("/:id", validateId(), authenticate(), TaskController.deleteTask);

export default router;