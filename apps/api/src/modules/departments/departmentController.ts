import { Request, Response, NextFunction } from "express";
import { departmentService } from "./departmentService";

export class DepartmentController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await departmentService.list();
      res.status(200).json({
        success: true,
        data: departments,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSla(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { slaHours } = req.body;
      const updated = await departmentService.updateSla(id!, slaHours);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const departmentController = new DepartmentController();
