import { z } from "zod";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  SUPPORTED_LANGUAGES,
  AI_SOURCES,
} from "../constants/categories";

export const ScoreBreakdownSchema = z.object({
  urgency: z.number().min(0).max(30),
  safetyHazard: z.number().min(0).max(25),
  poiProximity: z.number().min(0).max(25),
  nearestPoiName: z.string().optional(),
  distanceToPoiMeters: z.number().optional(),
  supportBoost: z.number().min(0).max(10),
  ageBoost: z.number().min(0).max(10),
  total: z.number().min(0).max(100),
});

export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const CreateComplaintSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(150),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  originalText: z.string().max(2000).optional(),
  language: z.enum(SUPPORTED_LANGUAGES).default("en"),
  category: z.enum(COMPLAINT_CATEGORIES),
  priority: z.enum(COMPLAINT_PRIORITIES).default("MEDIUM"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().max(255).optional(),
  imageUrl: z.string().optional(),
  aiReasoning: z.string().optional(),
  aiSource: z.enum(AI_SOURCES).default("RULE_BASED"),
  departmentId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;

export const AnalyzeInputSchema = z.object({
  text: z.string().optional(),
  language: z.enum(SUPPORTED_LANGUAGES).default("en"),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

export const UpdateStatusSchema = z.object({
  status: z.enum(COMPLAINT_STATUSES),
  remarks: z.string().max(500).optional(),
});

export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

export const ResolveComplaintSchema = z.object({
  afterImageUrl: z.string().min(1, "Proof of resolution image is required"),
  remarks: z.string().max(500).optional(),
});

export type ResolveComplaintInput = z.infer<typeof ResolveComplaintSchema>;

export const ReopenComplaintSchema = z.object({
  remarks: z.string().max(500).optional(),
});

export type ReopenComplaintInput = z.infer<typeof ReopenComplaintSchema>;

export const NearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().default(100),
  category: z.enum(COMPLAINT_CATEGORIES).optional(),
});

export type NearbyQueryInput = z.infer<typeof NearbyQuerySchema>;
