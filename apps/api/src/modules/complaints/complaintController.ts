import { Request, Response, NextFunction } from "express";
import { complaintService } from "./complaintService";
import { findNearbyDuplicates } from "./duplicateService";
import { ComplaintCategory, ComplaintStatus, ComplaintPriority } from "@civicresolve/shared";
import { UnauthorizedError, ForbiddenError } from "../../utils/errors";

export class ComplaintController {
  async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, language, imageBase64, imageMimeType } = req.body;
      const result = await complaintService.analyze({
        text,
        language,
        imageBase64,
        imageMimeType,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const citizenId = req.user?.id || null;
      const complaint = await complaintService.create(req.body, citizenId);

      res.status(201).json({
        success: true,
        data: complaint,
      });
    } catch (err) {
      next(err);
    }
  }

  async getByTrackingCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trackingCode } = req.params;
      const complaint = await complaintService.getByTrackingCode(trackingCode!);

      res.status(200).json({
        success: true,
        data: complaint,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        status,
        category,
        priority,
        isEscalated,
        departmentId,
        citizenId,
        search,
        page,
        limit,
      } = req.query;

      // Security: BOLA / IDOR protection on citizen private complaint listings
      if (citizenId) {
        if (!req.user) {
          throw new UnauthorizedError("Authentication required to view citizen complaints");
        }
        if (req.user.role !== "ADMIN" && req.user.id !== citizenId) {
          throw new ForbiddenError("You cannot access another citizen's private complaints");
        }
      }

      const complaints = await complaintService.list({
        status: status as ComplaintStatus,
        category: category as ComplaintCategory,
        priority: priority as ComplaintPriority,
        isEscalated: isEscalated !== undefined ? isEscalated === "true" : undefined,
        departmentId: departmentId as string,
        citizenId: citizenId as string,
        search: search as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({
        success: true,
        data: complaints,
      });
    } catch (err) {
      next(err);
    }
  }

  async getNearby(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat, lng, radiusMeters, category } = req.query;

      const duplicates = await findNearbyDuplicates({
        lat: Number(lat),
        lng: Number(lng),
        radiusMeters: radiusMeters ? Number(radiusMeters) : 100,
        category: category as ComplaintCategory,
      });

      res.status(200).json({
        success: true,
        data: duplicates,
      });
    } catch (err) {
      next(err);
    }
  }

  async support(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await complaintService.support(id!, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const updated = await complaintService.updateStatus(id!, req.body, adminId);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;

      const resolved = await complaintService.resolveComplaint(id!, req.body, adminId);

      res.status(200).json({
        success: true,
        data: resolved,
      });
    } catch (err) {
      next(err);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const citizenId = req.user?.id || null;
      const userRole = req.user?.role;

      const confirmed = await complaintService.confirmResolution(id!, citizenId, userRole);

      res.status(200).json({
        success: true,
        data: confirmed,
      });
    } catch (err) {
      next(err);
    }
  }

  async reopen(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const citizenId = req.user?.id || null;
      const userRole = req.user?.role;
      const { remarks } = req.body;

      const reopened = await complaintService.reopenComplaint(id!, remarks, citizenId, userRole);

      res.status(200).json({
        success: true,
        data: reopened,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const complaintController = new ComplaintController();
