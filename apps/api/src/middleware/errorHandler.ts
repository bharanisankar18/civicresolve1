import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../config/logger";

interface PrismaErrorWithCode extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    logger.warn({ issues: err.issues }, "Validation failed");
    res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
    });
    return;
  }

  // Multer errors (e.g. file size exceeded)
  if (err.name === "MulterError") {
    logger.warn({ err }, "File upload error");
    res.status(400).json({
      success: false,
      error: {
        message: err.message,
      },
    });
    return;
  }

  // Prisma Database Known Request Errors
  const prismaErr = err as PrismaErrorWithCode;
  if (err.name === "PrismaClientKnownRequestError" || Boolean(prismaErr.code?.startsWith("P"))) {
    logger.warn({ code: prismaErr.code, meta: prismaErr.meta }, "Database constraint error");
    if (prismaErr.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          message: "A database unique constraint conflict occurred",
        },
      });
      return;
    }
    if (prismaErr.code === "P2025") {
      res.status(404).json({
        success: false,
        error: {
          message: "Record not found",
        },
      });
      return;
    }
    if (prismaErr.code === "P2003") {
      res.status(400).json({
        success: false,
        error: {
          message: "Database foreign key constraint violation",
        },
      });
      return;
    }
  }

  logger.error({ err }, "Unhandled application error");
  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
    },
  });
}
