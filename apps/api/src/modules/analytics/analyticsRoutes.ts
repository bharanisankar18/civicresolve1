import { Router } from "express";
import { analyticsController } from "./analyticsController";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";

const router = Router();

// Public transparency endpoint (no personal citizen data)
router.get("/stats", analyticsController.getPublicStats.bind(analyticsController));

// Admin analytics & heatmap endpoint
router.get(
  "/heatmap",
  authenticate,
  requireRole("ADMIN"),
  analyticsController.getHeatmapPoints.bind(analyticsController),
);

export default router;
