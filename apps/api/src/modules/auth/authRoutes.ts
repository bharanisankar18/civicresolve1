import { Router } from "express";
import { authController } from "./authController";
import { validateBody } from "../../middleware/validate";
import { RegisterSchema, LoginSchema } from "@civicresolve/shared";
import { authenticate } from "../../middleware/auth";
import { authRateLimiter } from "../../middleware/rateLimiter";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validateBody(RegisterSchema),
  authController.register.bind(authController),
);

router.post(
  "/login",
  authRateLimiter,
  validateBody(LoginSchema),
  authController.login.bind(authController),
);

router.post("/logout", authController.logout.bind(authController));

router.get("/me", authenticate, authController.getMe.bind(authController));

export default router;
