import { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analyticsService";

export class AnalyticsController {
  async getPublicStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await analyticsService.getPublicStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async getHeatmapPoints(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const points = await analyticsService.getHeatmapPoints();
      res.status(200).json({
        success: true,
        data: points,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
