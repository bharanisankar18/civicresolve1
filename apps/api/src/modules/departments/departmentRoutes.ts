import { Router } from "express";
import { departmentController } from "./departmentController";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { UpdateDepartmentSlaSchema } from "@civicresolve/shared";

const router = Router();

router.get("/", departmentController.list.bind(departmentController));

router.patch(
  "/:id/sla",
  authenticate,
  requireRole("ADMIN"),
  validateBody(UpdateDepartmentSlaSchema),
  departmentController.updateSla.bind(departmentController),
);

export default router;
