import { prisma } from "../../config/prisma";

export class AnalyticsRepository {
  async getGeneralStats() {
    const complaints = await prisma.complaint.findMany({
      select: {
        id: true,
        category: true,
        priority: true,
        status: true,
        impactScore: true,
        lat: true,
        lng: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = complaints.length;
    let resolved = 0;
    let inProgress = 0;
    let escalated = 0;

    for (const c of complaints) {
      if (c.status === "RESOLVED") resolved++;
      else if (c.status === "IN_PROGRESS") inProgress++;
      else if (c.status === "ESCALATED") escalated++;
    }

    return { total, resolved, inProgress, escalated, complaints };
  }

  async getHeatmapPoints() {
    return prisma.complaint.findMany({
      where: {
        status: { in: ["REPORTED", "IN_PROGRESS", "ESCALATED"] },
      },
      select: {
        id: true,
        trackingCode: true,
        title: true,
        category: true,
        priority: true,
        status: true,
        impactScore: true,
        lat: true,
        lng: true,
        address: true,
        createdAt: true,
      },
    });
  }
}

export const analyticsRepository = new AnalyticsRepository();
