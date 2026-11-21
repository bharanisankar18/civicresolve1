import cron from "node-cron";
import { prisma } from "../config/prisma";
import { logger } from "../config/logger";

/**
 * Scans for un-resolved grievances that breached department SLA hours,
 * automatically elevating them to ESCALATED status with a timeline record.
 */
export async function checkAndEscalateOverdueComplaints(): Promise<number> {
  const now = new Date();
  logger.info("Running automated SLA breach & escalation check...");

  // Find active complaints where SLA is breached
  const breachedComplaints = await prisma.complaint.findMany({
    where: {
      status: { in: ["REPORTED", "IN_PROGRESS"] },
      isEscalated: false,
      slaDueAt: {
        lt: now,
      },
    },
    select: { id: true, trackingCode: true },
  });

  if (breachedComplaints.length === 0) {
    logger.info("SLA check complete: No breached complaints found.");
    return 0;
  }

  logger.warn(
    { count: breachedComplaints.length },
    `Detected ${breachedComplaints.length} complaints breaching SLA. Elevating...`,
  );

  const ids = breachedComplaints.map((c) => c.id);
  await prisma.$transaction([
    prisma.complaint.updateMany({
      where: { id: { in: ids } },
      data: {
        isEscalated: true,
        status: "ESCALATED",
      },
    }),
    prisma.statusEvent.createMany({
      data: ids.map((id) => ({
        complaintId: id,
        status: "ESCALATED",
        remarks: "Automated SLA Escalation: Grievance breached resolution deadline.",
      })),
    }),
  ]);

  logger.info(`Successfully escalated ${breachedComplaints.length} overdue grievances.`);
  return breachedComplaints.length;
}

/**
 * SLA Escalation Background Job.
 * Runs every 5 minutes to scan for un-resolved grievances that breached department SLA hours.
 */
export function startSlaEscalationJob() {
  const task = cron.schedule("*/5 * * * *", async () => {
    try {
      await checkAndEscalateOverdueComplaints();
    } catch (error) {
      logger.error({ error }, "Error executing SLA escalation cron job");
    }
  });

  return task;
}
