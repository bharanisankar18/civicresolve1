import {
  ComplaintCategory,
  ComplaintStatus,
  ComplaintPriority,
  AISource,
  SupportedLanguage,
} from "../constants/categories";
import { ScoreBreakdown } from "../schemas/complaint";
import { AIVerificationOutput } from "../schemas/ai";

export interface ComplaintDto {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  originalText?: string | null;
  language: SupportedLanguage;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  impactScore: number;
  scoreBreakdown: ScoreBreakdown;
  aiReasoning?: string | null;
  aiSource: AISource;
  lat: number;
  lng: number;
  address?: string | null;
  imageUrl?: string | null;
  afterImageUrl?: string | null;
  verificationResult?: AIVerificationOutput | null;
  supportCount: number;
  slaDueAt: string | Date;
  isEscalated: boolean;
  citizenId?: string | null;
  citizen?: {
    id: string;
    fullName: string;
  } | null;
  departmentId: string;
  department?: {
    id: string;
    name: string;
    code: string;
    slaHours: number;
  };
  statusEvents?: StatusEventDto[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StatusEventDto {
  id: string;
  status: ComplaintStatus;
  remarks?: string | null;
  updatedById?: string | null;
  updatedBy?: {
    id: string;
    fullName: string;
    role: string;
  } | null;
  createdAt: string | Date;
}

export interface DepartmentDto {
  id: string;
  code: string;
  name: string;
  slaHours: number;
  description?: string | null;
  complaintCount?: number;
}

export interface AnalyticsStatsDto {
  totalComplaints: number;
  resolvedComplaints: number;
  inProgressComplaints: number;
  escalatedComplaints: number;
  resolutionRatePercentage: number;
  averageResolutionHours: number;
  categoryCounts: Record<ComplaintCategory, number>;
  priorityCounts: Record<ComplaintPriority, number>;
  statusCounts: Record<ComplaintStatus, number>;
  monthlyTrends: {
    month: string;
    reported: number;
    resolved: number;
  }[];
}
