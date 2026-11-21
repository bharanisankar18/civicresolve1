import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "./authRepository";
import { env } from "../../config/env";
import { ConflictError, UnauthorizedError, NotFoundError } from "../../utils/errors";
import { LoginInput, RegisterInput, UserRole } from "@civicresolve/shared";

export class AuthService {
  /**
   * Registers a new user account
   */
  async register(input: RegisterInput) {
    const existing = await authRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("An account with this email address already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await authRepository.create({
      fullName: input.fullName,
      email: input.email,
      role: "CITIZEN", // Security: Force CITIZEN role on public registration to prevent privilege escalation
      passwordHash,
    });

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      fullName: user.fullName,
    });

    return { user, token };
  }

  /**
   * Authenticates user credentials and issues JWT
   */
  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email);
    // Security: Constant-time comparison prevents timing attacks / email enumeration
    const DUMMY_HASH = "$2a$10$e8w4GvKj45c7kZ8Z0Y8c6.Uf1u3x8pYqZ8z6p1k5w4e7r8t9y0u1i";
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const isMatch = await bcrypt.compare(input.password, hashToCompare);

    if (!user || !isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      fullName: user.fullName,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Retrieves profile of current authenticated user
   */
  async getMe(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User profile not found");
    }
    return user;
  }

  private generateToken(payload: { id: string; email: string; role: UserRole; fullName: string }) {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: "7d",
    });
  }
}

export const authService = new AuthService();
