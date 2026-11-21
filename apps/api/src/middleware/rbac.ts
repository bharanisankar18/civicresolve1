import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";
import { UserRole } from "@civicresolve/shared";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Access requires one of: ${allowedRoles.join(", ")}`);
    }

    next();
  };
}
