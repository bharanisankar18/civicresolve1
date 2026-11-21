import { z } from "zod";
import { USER_ROLES } from "../constants/categories";

export const RegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(USER_ROLES).default("CITIZEN"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UserResponseSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  role: z.enum(USER_ROLES),
  createdAt: z.string().or(z.date()),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
