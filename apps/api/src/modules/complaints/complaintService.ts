import crypto from "crypto";
import { complaintRepository, ComplaintFilterOptions } from "./complaintRepository";
import { departmentRepository } from "../departments/departmentRepository";
import { analyzeCivicGrievance, AnalyzeRequestOptions } from "../ai/geminiService";
import { verifyResolutionProof } from "../ai/verificationService";
import { calculateImpactScore } from "../ai/fallbackClassifier";
import { calculateSlaDueDate } from "../../utils/slaCalculator";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from "../../utils/errors";
import { analyticsService } from "../analytics/analyticsService";
import {
  CreateComplaintInput,
  UpdateStatusInput,
  ResolveComplaintInput,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  SupportedLanguage,
  AISource,
  ScoreBreakdown,
  ComplaintDto,
} from "@civicresolve/shared";

export class ComplaintService {
  /**
   * AI-powered analysis of grievance text and/or photo
   */
  async analyze(options: AnalyzeRequestOptions) {
    return analyzeCivicGrievance(options);
  }

  /**
   * Submits a new citizen complaint
   */
  async create(input: CreateComplaintInput, citizenId?: string | null): Promise<ComplaintDto> {
    // 1. Resolve municipal department
    let department = null;
    if (input.departmentId) {
      department = await departmentRepository.findById(input.departmentId);
    }

    if (!department) {
      // Map category to department code
      const catToDept: Record<ComplaintCategory, string> = {
        POTHOLE: "ROADS",
        BAD_ROAD: "ROADS",
        GARBAGE: "SANITATION",
        STREETLIGHT: "ELECTRICAL",
        WATER_LEAKAGE: "WATER_DRAINAGE",
        DRAINAGE: "WATER_DRAINAGE",
      };
      const deptCode = catToDept[input.category] || "ROADS";
      department = await departmentRepository.findByCode(deptCode);
    }

    if (!department) {
      throw new BadRequestError(
        "Municipal department for complaint category could not be resolved",
      );
    }

    // 2. Generate unique tracking code e.g. CR-2024-XXXX
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const trackingCode = `CR-${new Date().getFullYear()}-${randomHex}`;

    // 3. Compute initial SLA target time
    const slaDueAt = calculateSlaDueDate(new Date(), department.slaHours);

    // 4. Calculate Explainable Impact Score
    const urgency =
      input.priority === "CRITICAL"
        ? 30
        : input.priority === "HIGH"
          ? 22
          : input.priority === "MEDIUM"
            ? 14
            : 6;
    const safetyHazard = input.priority === "CRITICAL" ? 25 : input.priority === "HIGH" ? 18 : 10;

    const { impactScore, breakdown } = calculateImpactScore({
      urgencyScore: urgency,
      safetyHazardScore: safetyHazard,
      lat: input.lat,
      lng: input.lng,
      supportCount: 0,
      createdAt: new Date(),
    });

    // 5. Store record
    const created = await complaintRepository.create({
      trackingCode,
      title: input.title,
      description: input.description,
      originalText: input.originalText || input.description,
      language: input.language,
      category: input.category,
      priority: input.priority,
      impactScore,
      scoreBreakdown: JSON.stringify(breakdown),
      aiReasoning: input.aiReasoning || "AI triage assessment completed.",
      aiSource: input.aiSource,
      lat: input.lat,
      lng: input.lng,
      address: input.address,
      imageUrl: input.imageUrl,
      slaDueAt,
      citizenId: input.isAnonymous ? null : citizenId,
      departmentId: department.id,
    });

    analyticsService.invalidateCache();
    return this.mapToDto(created);
  }

  async getByTrackingCode(trackingCode: string): Promise<ComplaintDto> {
    const complaint = await complaintRepository.findByTrackingCode(trackingCode);
    if (!complaint) {
      throw new NotFoundError(`Grievance with tracking code '${trackingCode}' not found`);
    }
    return this.mapToDto(complaint);
  }

  async getById(id: string): Promise<ComplaintDto> {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new NotFoundError("Complaint not found");
    }
    return this.mapToDto(complaint);
  }

  async list(options: ComplaintFilterOptions) {
    const result = await complaintRepository.list(options);
    return {
      ...result,
      items: result.items.map((item) => this.mapToDto(item)),
    };
  }

  async support(complaintId: string, userId: string) {
    const complaint = await complaintRepository.findById(complaintId);
    if (!complaint) {
      throw new NotFoundError("Complaint not found");
    }

    const hasSupported = await complaintRepository.hasUserSupported(complaintId, userId);
    if (hasSupported) {
      throw new ConflictError("You have already supported this complaint");
    }

    const updated = await complaintRepository.addSupport(complaintId, userId);

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
        total: updated.impactScore,
      };
    }

    analyticsService.invalidateCache();

    return {
      success: true,
      supportCount: updated.supportCount,
      impactScore: updated.impactScore,
      scoreBreakdown: breakdown,
    };
  }

  async updateStatus(id: string, input: UpdateStatusInput, adminId: string): Promise<ComplaintDto> {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new NotFoundError("Complaint not found");
    }

    if (input.status === "RESOLVED") {
      throw new BadRequestError(
        "Direct status update to RESOLVED is not permitted. Please submit resolution photo evidence via the /resolve endpoint for Gemini AI verification.",
      );
    }

    if (complaint.status === "RESOLVED") {
      throw new BadRequestError(
        "Complaint is already RESOLVED. Status cannot be modified directly; citizens may reopen the complaint if repairs were unsatisfactory.",
      );
    }

    if (complaint.status === input.status) {
      throw new BadRequestError(`Complaint is already in status '${input.status}'`);
    }

    const validTransitions: Record<string, string[]> = {
      REPORTED: ["IN_PROGRESS", "REJECTED"],
      IN_PROGRESS: ["ESCALATED", "REJECTED"],
      ESCALATED: ["IN_PROGRESS", "REJECTED"],
      REJECTED: ["IN_PROGRESS"],
    };

    const allowed = validTransitions[complaint.status];
    if (!allowed || !allowed.includes(input.status)) {
      throw new BadRequestError(
        `Invalid status transition from '${complaint.status}' to '${input.status}'`,
      );
    }

    const updated = await complaintRepository.updateStatus({
      id,
      status: input.status,
      remarks: input.remarks,
      updatedById: adminId,
    });

    analyticsService.invalidateCache();
    return this.getById(updated.id);
  }

  async resolveComplaint(
    id: string,
    input: ResolveComplaintInput,
    adminId: string,
  ): Promise<ComplaintDto> {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new NotFoundError("Complaint not found");
    }

    // 1. Verify before and after images with Gemini AI
    const verification = await verifyResolutionProof({
      category: complaint.category,
      beforeImagePath: complaint.imageUrl,
      afterImagePath: input.afterImageUrl,
      remarks: input.remarks,
    });

    // 2. Mark resolved
    await complaintRepository.resolve({
      id,
      afterImageUrl: input.afterImageUrl,
      verificationResult: JSON.stringify(verification),
      remarks: input.remarks || verification.reason,
      adminId,
    });

    analyticsService.invalidateCache();
    return this.getById(id);
  }

  /**
   * Citizen verifies and confirms municipal resolution
   */
  async confirmResolution(
    id: string,
    citizenId?: string | null,
    userRole?: string,
  ): Promise<ComplaintDto> {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new NotFoundError("Complaint not found");
    }
    if (complaint.status !== "RESOLVED") {
      throw new BadRequestError("Only resolved complaints can be confirmed by citizens");
    }

    if (complaint.citizenId) {
      if (!citizenId) {
        throw new UnauthorizedError("Authentication required to confirm this grievance");
      }
      if (complaint.citizenId !== citizenId && userRole !== "ADMIN") {
        throw new ForbiddenError("You cannot confirm another citizen's grievance");
      }
    }

    await complaintRepository.confirmResolution(id, citizenId);
    analyticsService.invalidateCache();
    return this.getById(id);
  }

  /**
   * Citizen reopens a grievance if the repair was unsatisfactory
   */
  async reopenComplaint(
    id: string,
    remarks?: string,
    citizenId?: string | null,
    userRole?: string,
  ): Promise<ComplaintDto> {
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      throw new NotFoundError("Complaint not found");
    }
    if (complaint.status !== "RESOLVED") {
      throw new BadRequestError("Only resolved complaints can be reopened");
    }

    if (complaint.citizenId) {
      if (!citizenId) {
        throw new UnauthorizedError("Authentication required to reopen this grievance");
      }
      if (complaint.citizenId !== citizenId && userRole !== "ADMIN") {
        throw new ForbiddenError("You cannot reopen another citizen's grievance");
      }
    }

    await complaintRepository.reopenComplaint(id, remarks, citizenId);
    analyticsService.invalidateCache();
    return this.getById(id);
  }

  private mapToDto(model: Record<string, unknown>): ComplaintDto {
    let scoreBreakdown: ScoreBreakdown;
    try {
      scoreBreakdown = JSON.parse(model.scoreBreakdown as string);
    } catch (_e) {
      scoreBreakdown = {
        urgency: 0,
        safetyHazard: 0,
        poiProximity: 0,
        supportBoost: 0,
        ageBoost: 0,
        total: (model.impactScore as number) || 0,
      };
    }

    let verificationResult = null;
    if (model.verificationResult) {
      try {
        verificationResult = JSON.parse(model.verificationResult as string);
      } catch (_e) {
        // ignore
      }
    }

    const citizen = model.citizen as { id: string; fullName: string } | null | undefined;
    const department = model.department as
      { id: string; name: string; code: string; slaHours: number } | undefined;
    const statusEvents = model.statusEvents as
      | Array<{
          id: string;
          status: string;
          remarks?: string | null;
          updatedById?: string | null;
          updatedBy?: { id: string; fullName: string; role: string } | null;
          createdAt: string | Date;
        }>
      | undefined;

    return {
      id: model.id as string,
      trackingCode: model.trackingCode as string,
      title: model.title as string,
      description: model.description as string,
      originalText: model.originalText as string | undefined,
      language: model.language as SupportedLanguage,
      category: model.category as ComplaintCategory,
      status: model.status as ComplaintStatus,
      priority: model.priority as ComplaintPriority,
      impactScore: model.impactScore as number,
      scoreBreakdown,
      aiReasoning: model.aiReasoning as string | undefined,
      aiSource: model.aiSource as AISource,
      lat: model.lat as number,
      lng: model.lng as number,
      address: model.address as string | undefined,
      imageUrl: model.imageUrl as string | undefined,
      afterImageUrl: model.afterImageUrl as string | undefined,
      verificationResult,
      supportCount: model.supportCount as number,
      slaDueAt: model.slaDueAt as Date,
      isEscalated: Boolean(model.isEscalated),
      citizenId: model.citizenId as string | undefined,
      citizen: citizen ? { id: citizen.id, fullName: citizen.fullName } : null,
      departmentId: model.departmentId as string,
      department: department
        ? {
            id: department.id,
            name: department.name,
            code: department.code,
            slaHours: department.slaHours,
          }
        : undefined,
      statusEvents: statusEvents?.map((e) => ({
        id: e.id,
        status: e.status as ComplaintStatus,
        remarks: e.remarks,
        updatedById: e.updatedById,
        updatedBy: e.updatedBy
          ? { id: e.updatedBy.id, fullName: e.updatedBy.fullName, role: e.updatedBy.role }
          : null,
        createdAt: e.createdAt,
      })),
      createdAt: model.createdAt as Date,
      updatedAt: model.updatedAt as Date,
    };
  }
}

export const complaintService = new ComplaintService();
