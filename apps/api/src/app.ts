import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { standardRateLimiter } from "./middleware/rateLimiter";

import authRoutes from "./modules/auth/authRoutes";
import complaintRoutes from "./modules/complaints/complaintRoutes";
import departmentRoutes from "./modules/departments/departmentRoutes";
import analyticsRoutes from "./modules/analytics/analyticsRoutes";

export function createApp(): Express {
  const app = express();

  // 1. Security Headers via Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }, // allow serving uploaded images
    }),
  );

  // 2. CORS Allowlist
  const allowedOrigins =
    env.NODE_ENV === "production"
      ? [env.CLIENT_URL]
      : [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );

  // 3. Body parsers & cookies
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser(env.COOKIE_SECRET || env.JWT_SECRET));

  // 4. Rate Limiting on general API routes
  app.use("/api", standardRateLimiter);

  // 5. Static file serving for sanitized public uploads
  const uploadsPath = path.resolve(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsPath));

  // 6. Health check route
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 7. Core API Modules
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/complaints", complaintRoutes);
  app.use("/api/v1/departments", departmentRoutes);
  app.use("/api/v1/analytics", analyticsRoutes);

  // 8. Central Error Handling Middleware
  app.use(errorHandler);

  return app;
}
