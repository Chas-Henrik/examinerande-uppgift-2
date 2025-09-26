// src/routes/health.route.ts
import express from "express"

const router = express.Router()

// Health check route
router.get('/', (_req, res) => res.status(200).json({ ok: true, status: "Healthy" }));

export default router;