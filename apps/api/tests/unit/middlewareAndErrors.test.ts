import { describe, it, expect, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import multer from "multer";
import { errorHandler } from "../../src/middleware/errorHandler";
import { extractToken, authenticate, optionalAuth } from "../../src/middleware/auth";
import { uploadMemory, sanitizeAndSaveImage } from "../../src/middleware/upload";
import {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from "../../src/utils/errors";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env";

const mockNext = vi.fn() as unknown as NextFunction;

describe("Error Handler Middleware & Custom Errors", () => {
  const createMockRes = () => {
    const res: Partial<Response> = {};
    res.statusCode = 200;
    res.status = vi.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    });
    res.json = vi.fn().mockImplementation((data: unknown) => data);
    return res as Response;
  };

  it("handles AppError properly with custom status code", () => {
    const res = createMockRes();
    const err = new NotFoundError("Custom resource missing");
    errorHandler(err, {} as Request, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: "Custom resource missing",
        details: undefined,
      },
    });
  });

  it("handles ZodError properly with 400 and mapped issues", () => {
    const res = createMockRes();
    const schema = z.object({ title: z.string().min(5) });
    const result = schema.safeParse({ title: "abc" });
    const zodError = (result as { error: ZodError }).error;

    errorHandler(zodError, {} as Request, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: "Validation failed",
          details: expect.arrayContaining([expect.objectContaining({ path: "title" })]),
        }),
      }),
    );
  });

  it("handles MulterError with 400", () => {
    const res = createMockRes();
    const multerErr = new multer.MulterError("LIMIT_FILE_SIZE");
    errorHandler(multerErr, {} as Request, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: multerErr.message,
      },
    });
  });

  it("handles unhandled generic errors with 500", () => {
    const res = createMockRes();
    const genericErr = new Error("Database connection dropped");
    errorHandler(genericErr, {} as Request, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: "Internal server error",
      },
    });
  });

  it("instantiates all AppError subclasses with correct status codes", () => {
    expect(new AppError("Generic", 503).statusCode).toBe(503);
    expect(new BadRequestError("Bad").statusCode).toBe(400);
    expect(new UnauthorizedError("Unauth").statusCode).toBe(401);
    expect(new ForbiddenError("Forbid").statusCode).toBe(403);
    expect(new ConflictError("Conflict").statusCode).toBe(409);
  });

  it("handles Prisma P2002 unique constraint error with 409", () => {
    const res = createMockRes();
    const prismaErr = new Error("Unique constraint failed") as Error & {
      code?: string;
      name: string;
    };
    prismaErr.name = "PrismaClientKnownRequestError";
    prismaErr.code = "P2002";
    errorHandler(prismaErr, {} as Request, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: "A database unique constraint conflict occurred",
        }),
      }),
    );
  });

  it("handles Prisma P2025 record not found error with 404", () => {
    const res = createMockRes();
    const prismaErr = new Error("Record not found") as Error & { code?: string; name: string };
    prismaErr.name = "PrismaClientKnownRequestError";
    prismaErr.code = "P2025";
    errorHandler(prismaErr, {} as Request, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("handles Prisma P2003 foreign key violation with 400", () => {
    const res = createMockRes();
    const prismaErr = new Error("Foreign key violation") as Error & { code?: string; name: string };
    prismaErr.name = "PrismaClientKnownRequestError";
    prismaErr.code = "P2003";
    errorHandler(prismaErr, {} as Request, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("Auth Middleware Units", () => {
  it("extracts token from cookie or authorization header", () => {
    expect(extractToken({ cookies: { token: "tok123" } } as unknown as Request)).toBe("tok123");
    expect(
      extractToken({ headers: { authorization: "Bearer tok456" } } as unknown as Request),
    ).toBe("tok456");
    expect(
      extractToken({ headers: { authorization: "Basic xyz" } } as unknown as Request),
    ).toBeNull();
    expect(extractToken({} as Request)).toBeNull();
  });

  it("authenticates valid token and attaches user to request", () => {
    const token = jwt.sign(
      { id: "u1", email: "user@test.org", role: "CITIZEN", fullName: "Citizen Test" },
      env.JWT_SECRET,
    );
    const req = { cookies: { token } } as unknown as Request;
    const next = vi.fn();

    authenticate(req, {} as Response, next);
    expect(req.user?.id).toBe("u1");
    expect(next).toHaveBeenCalled();
  });

  it("throws UnauthorizedError if token is missing or invalid", () => {
    expect(() => authenticate({} as Request, {} as Response, mockNext)).toThrow(UnauthorizedError);
    expect(() =>
      authenticate(
        { headers: { authorization: "Bearer invalid" } } as unknown as Request,
        {} as Response,
        mockNext,
      ),
    ).toThrow(UnauthorizedError);
  });

  it("optionalAuth handles present, invalid, and missing tokens gracefully", () => {
    const token = jwt.sign(
      { id: "u2", email: "opt@test.org", role: "ADMIN", fullName: "Admin Opt" },
      env.JWT_SECRET,
    );
    const next = vi.fn();

    // Valid token
    const req1 = { cookies: { token } } as unknown as Request;
    optionalAuth(req1, {} as Response, next);
    expect(req1.user?.id).toBe("u2");

    // Invalid token
    const req2 = { headers: { authorization: "Bearer bad" } } as unknown as Request;
    optionalAuth(req2, {} as Response, next);
    expect(req2.user).toBeUndefined();

    // Missing token
    const req3 = {} as Request;
    optionalAuth(req3, {} as Response, next);
    expect(req3.user).toBeUndefined();
  });
});

describe("Upload Middleware Units", () => {
  it("allows valid image mime types and rejects others in fileFilter", () => {
    const filter = (
      uploadMemory as unknown as {
        fileFilter: (
          req: unknown,
          file: { mimetype: string; originalname?: string },
          cb: (err: Error | null, ok?: boolean) => void,
        ) => void;
      }
    ).fileFilter;
    const cb = vi.fn();

    filter({}, { mimetype: "image/jpeg", originalname: "test.jpg" }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);

    filter({}, { mimetype: "image/png", originalname: "test.png" }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);

    filter({}, { mimetype: "application/pdf", originalname: "doc.pdf" }, cb);
    expect(cb).toHaveBeenCalledWith(expect.any(BadRequestError));
  });

  it("sanitizeAndSaveImage passes through if no file is uploaded", async () => {
    const next = vi.fn();
    const req = { body: {} } as Request;
    await sanitizeAndSaveImage(req, {} as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it("sanitizeAndSaveImage handles corrupt file buffer gracefully", async () => {
    const next = vi.fn();
    const req = {
      file: { buffer: Buffer.from("not an image") },
      body: {},
    } as unknown as Request;
    await sanitizeAndSaveImage(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
  });
});
