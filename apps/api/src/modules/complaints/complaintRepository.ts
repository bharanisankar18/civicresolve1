import { prisma } from "../../config/prisma";
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ScoreBreakdown,
} from "@civicresolve/shared";

export interface ComplaintFilterOptions {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  priority?: ComplaintPriority;
  isEscalated?: boolean;
  departmentId?: string;
  citizenId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ComplaintRepository {
  async create(data: {
    trackingCode: string;
    title: string;
    description: string;
    originalText?: string;
    language: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    impactScore: number;
    scoreBreakdown: string;
    aiReasoning?: string;
    aiSource: string;
    lat: number;
    lng: number;
    address?: string;
    imageUrl?: string;
    slaDueAt: Date;
    citizenId?: string | null;
    departmentId: string;
  }) {
    return prisma.complaint.create({
      data: {
        ...data,
        statusEvents: {
          create: {
            status: "REPORTED",
            remarks: "Complaint registered by citizen.",
            updatedById: data.citizenId || null,
          },
        },
      },
      include: {
        department: true,
        citizen: {
          select: { id: true, fullName: true, email: true },
        },
        statusEvents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async findByTrackingCode(trackingCode: string) {
    return prisma.complaint.findUnique({
      where: { trackingCode },
      include: {
        department: true,
        citizen: {
          select: { id: true, fullName: true, email: true },
        },
        statusEvents: {
          orderBy: { createdAt: "desc" },
          include: {
            updatedBy: { select: { id: true, fullName: true, role: true } },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.complaint.findUnique({
      where: { id },
      include: {
        department: true,
        citizen: {
          select: { id: true, fullName: true, email: true },
        },
        statusEvents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async list(options: ComplaintFilterOptions = {}) {
    const {
      status,
      category,
      priority,
      isEscalated,
      departmentId,
      citizenId,
      search,
      page = 1,
      limit = 20,
    } = options;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (typeof isEscalated === "boolean") where.isEscalated = isEscalated;
    if (departmentId) where.departmentId = departmentId;
    if (citizenId) where.citizenId = citizenId;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { trackingCode: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isEscalated: "desc" }, { impactScore: "desc" }, { createdAt: "desc" }],
        include: {
          department: true,
          citizen: {
            select: { id: true, fullName: true },
          },
          statusEvents: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOpenComplaintsNearby(params: {
    lat: number;
    lng: number;
    radiusMeters: number;
    category?: ComplaintCategory;
  }) {
    const { lat, lng, radiusMeters, category } = params;
    // Spatial bounding-box pre-filtering: 1 degree latitude ~= 111,000 meters
    const latDelta = (radiusMeters * 1.5) / 111000;
    const latRad = (lat * Math.PI) / 180;
    const cosLat = Math.max(0.1, Math.cos(latRad));
    const lngDelta = (radiusMeters * 1.5) / (111000 * cosLat);

    return prisma.complaint.findMany({
      where: {
        status: { in: ["REPORTED", "IN_PROGRESS", "ESCALATED"] },
        ...(category ? { category } : {}),
        lat: {
          gte: lat - latDelta,
          lte: lat + latDelta,
        },
        lng: {
          gte: lng - lngDelta,
          lte: lng + lngDelta,
        },
      },
      select: {
        id: true,
        trackingCode: true,
        title: true,
        description: true,
        category: true,
        status: true,
        impactScore: true,
        supportCount: true,
        lat: true,
        lng: true,
        address: true,
        imageUrl: true,
        createdAt: true,
      },
    });
  }

  async findOpenComplaintsByCategory(category?: ComplaintCategory) {
    return prisma.complaint.findMany({
      where: {
        status: { in: ["REPORTED", "IN_PROGRESS", "ESCALATED"] },
        ...(category ? { category } : {}),
      },
      select: {
        id: true,
        trackingCode: true,
        title: true,
        description: true,
        category: true,
        status: true,
        impactScore: true,
        supportCount: true,
        lat: true,
        lng: true,
        address: true,
        imageUrl: true,
        createdAt: true,
      },
    });
  }

  async hasUserSupported(complaintId: string, userId: string) {
    const existing = await prisma.complaintSupport.findUnique({
      where: {
        complaintId_userId: {
          complaintId,
          userId,
        },
      },
    });
    return !!existing;
  }

  async addSupport(complaintId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.complaintSupport.create({
        data: {
          complaintId,
          userId,
        },
      });

      const updated = await tx.complaint.update({
        where: { id: complaintId },
        data: {
          supportCount: { increment: 1 },
        },
      });

      let breakdown: ScoreBreakdown;
      try {
        breakdown = JSON.parse(updated.scoreBreakdown);
      } catch (_e) {
        breakdown = {
          urgency: 15,
          safetyHazard: 15,
          poiProximity: 0,
          supportBoost: 0,
          ageBoost: 0,
          total: 30,
        };
      }

      const newSupportBoost = Math.min(10, updated.supportCount * 2);
      const newTotal = Math.min(
        100,
        breakdown.urgency +
          breakdown.safetyHazard +
          breakdown.poiProximity +
          newSupportBoost +
          breakdown.ageBoost,
      );
      breakdown.supportBoost = newSupportBoost;
      breakdown.total = newTotal;

      return tx.complaint.update({
        where: { id: complaintId },
        data: {
          impactScore: newTotal,
          scoreBreakdown: JSON.stringify(breakdown),
        },
      });
    });
  }

  async updateStatus(params: {
    id: string;
    status: ComplaintStatus;
    remarks?: string;
    updatedById?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const isEscalated = params.status === "ESCALATED";

      const complaint = await tx.complaint.update({
        where: { id: params.id },
        data: {
          status: params.status,
          isEscalated,
        },
      });

      await tx.statusEvent.create({
        data: {
          complaintId: params.id,
          status: params.status,
          remarks: params.remarks || `Status transitioned to ${params.status}`,
          updatedById: params.updatedById || null,
        },
      });

      return complaint;
    });
  }

  async resolve(params: {
    id: string;
    afterImageUrl: string;
    verificationResult: string;
    remarks?: string;
    adminId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.update({
        where: { id: params.id },
        data: {
          status: "RESOLVED",
          isEscalated: false,
          afterImageUrl: params.afterImageUrl,
          verificationResult: params.verificationResult,
        },
      });

      await tx.statusEvent.create({
        data: {
          complaintId: params.id,
          status: "RESOLVED",
          remarks: params.remarks || "Grievance marked resolved with photo verification.",
          updatedById: params.adminId,
        },
      });

      return complaint;
    });
  }

  async updateImpactScoreAndBreakdown(id: string, score: number, breakdown: string) {
    return prisma.complaint.update({
      where: { id },
      data: {
        impactScore: score,
        scoreBreakdown: breakdown,
      },
    });
  }

  async confirmResolution(complaintId: string, citizenId?: string | null) {
    return prisma.statusEvent.create({
      data: {
        complaintId,
        status: "RESOLVED",
        remarks: "Citizen confirmed: resolution verified as satisfactory.",
        updatedById: citizenId || null,
      },
    });
  }

  async reopenComplaint(complaintId: string, remarks?: string, citizenId?: string | null) {
    return prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.update({
        where: { id: complaintId },
        data: {
          status: "IN_PROGRESS",
          isEscalated: true,
        },
      });

      await tx.statusEvent.create({
        data: {
          complaintId,
          status: "IN_PROGRESS",
          remarks: remarks || "Citizen reported resolution is unsatisfactory; grievance reopened.",
          updatedById: citizenId || null,
        },
      });

      return complaint;
    });
  }

  async markBreachedAsEscalated(complaintIds: string[]) {
    if (complaintIds.length === 0) return 0;

    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.complaint.updateMany({
        where: {
          id: { in: complaintIds },
        },
        data: {
          isEscalated: true,
          status: "ESCALATED",
        },
      });

      for (const id of complaintIds) {
        await tx.statusEvent.create({
          data: {
            complaintId: id,
            status: "ESCALATED",
            remarks: "Automated SLA Escalation: Issue breached resolution target hours.",
          },
        });
      }

      return updateResult.count;
    });
  }
}

export const complaintRepository = new ComplaintRepository();
