import { Router } from "express";
import { complaintController } from "./complaintController";
import { authenticate, optionalAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody, validateQuery } from "../../middleware/validate";
import { uploadMemory, sanitizeAndSaveImage } from "../../middleware/upload";
import { aiRateLimiter } from "../../middleware/rateLimiter";
import {
  CreateComplaintSchema,
  UpdateStatusSchema,
  ResolveComplaintSchema,
  ReopenComplaintSchema,
  NearbyQuerySchema,
  AnalyzeInputSchema,
} from "@civicresolve/shared";

const router = Router();

// Public / Citizen routes
router.post(
  "/analyze",
  aiRateLimiter,
  validateBody(AnalyzeInputSchema),
  complaintController.analyze.bind(complaintController),
);

// File upload endpoint for images
router.post("/upload", uploadMemory.single("image"), sanitizeAndSaveImage, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      imageUrl: req.body.imageUrl,
    },
  });
});

router.get(
  "/nearby",
  validateQuery(NearbyQuerySchema),
  complaintController.getNearby.bind(complaintController),
);

router.get("/track/:trackingCode", complaintController.getByTrackingCode.bind(complaintController));

router.get("/", optionalAuth, complaintController.list.bind(complaintController));

router.post(
  "/",
  optionalAuth,
  validateBody(CreateComplaintSchema),
  complaintController.create.bind(complaintController),
);

router.post("/:id/support", authenticate, complaintController.support.bind(complaintController));
router.post("/:id/confirm", optionalAuth, complaintController.confirm.bind(complaintController));
router.post(
  "/:id/reopen",
  optionalAuth,
  validateBody(ReopenComplaintSchema),
  complaintController.reopen.bind(complaintController),
);

// Admin-only routes
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  validateBody(UpdateStatusSchema),
  complaintController.updateStatus.bind(complaintController),
);

router.post(
  "/:id/resolve",
  authenticate,
  requireRole("ADMIN"),
  validateBody(ResolveComplaintSchema),
  complaintController.resolve.bind(complaintController),
);

export default router;
