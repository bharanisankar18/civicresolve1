import { Request, Response, NextFunction } from "express";
import { authService } from "./authService";
import { env } from "../../config/env";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await authService.register(req.body);
      res.cookie("token", token, COOKIE_OPTIONS);
      res.status(201).json({
        success: true,
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await authService.login(req.body);
      res.cookie("token", token, COOKIE_OPTIONS);
      res.status(200).json({
        success: true,
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    const clearOptions = {
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      path: COOKIE_OPTIONS.path,
    };
    res.clearCookie("token", clearOptions);
    res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
