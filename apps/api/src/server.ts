import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { startSlaEscalationJob } from "./jobs/slaEscalationCron";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 CivicResolve API running on http://localhost:${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV} | Gemini Model: ${env.GEMINI_MODEL}`);

  // Start background jobs if not running in test mode
  if (env.NODE_ENV !== "test") {
    startSlaEscalationJob();
    logger.info("⏱️ SLA Escalation Cron Job initialized.");
  }
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    logger.info("HTTP server closed");
  });
});
