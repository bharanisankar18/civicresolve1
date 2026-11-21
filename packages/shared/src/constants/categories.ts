export const COMPLAINT_CATEGORIES = [
  "POTHOLE",
  "GARBAGE",
  "STREETLIGHT",
  "WATER_LEAKAGE",
  "BAD_ROAD",
  "DRAINAGE",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_STATUSES = [
  "REPORTED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "ESCALATED",
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const COMPLAINT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type ComplaintPriority = (typeof COMPLAINT_PRIORITIES)[number];

export const USER_ROLES = ["CITIZEN", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SUPPORTED_LANGUAGES = ["en", "ta", "hi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const AI_SOURCES = ["GEMINI", "RULE_BASED"] as const;
export type AISource = (typeof AI_SOURCES)[number];
