import { z } from "zod";
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES } from "../constants/categories";

export const AIAnalysisOutputSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(1000),
  category: z.enum(COMPLAINT_CATEGORIES),
  priority: z.enum(COMPLAINT_PRIORITIES),
  urgencyScore: z.number().int().min(0).max(30),
  safetyHazardScore: z.number().int().min(0).max(25),
  reasoning: z.string().max(500),
  suggestedDepartmentCode: z.string(),
});

export type AIAnalysisOutput = z.infer<typeof AIAnalysisOutputSchema>;

export const AIVerificationOutputSchema = z.object({
  verified: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(500),
});

export type AIVerificationOutput = z.infer<typeof AIVerificationOutputSchema>;
