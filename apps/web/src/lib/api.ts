import {
  CreateComplaintInput,
  LoginInput,
  RegisterInput,
  UpdateStatusInput,
  ResolveComplaintInput,
  UserResponse,
  ComplaintDto,
  DepartmentDto,
  AnalyticsStatsDto,
  ComplaintCategory,
  ComplaintPriority,
} from "@civicresolve/shared";

const API_BASE = "/api/v1";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    const errorMsg = json?.error?.message || "Request failed";
    throw new Error(errorMsg);
  }

  return json.data;
}

export const api = {
  // Auth
  login: (data: LoginInput) =>
    request<{ user: UserResponse; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  register: (data: RegisterInput) =>
    request<{ user: UserResponse; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
  getMe: () => request<UserResponse>("/auth/me"),

  // Complaints
  analyze: (data: {
    text?: string;
    language?: string;
    imageBase64?: string;
    imageMimeType?: string;
  }) =>
    request<{
      analysis: {
        title: string;
        description: string;
        category: ComplaintCategory;
        priority: ComplaintPriority;
        urgencyScore: number;
        safetyHazardScore: number;
        reasoning: string;
        suggestedDepartmentCode: string;
      };
      source: "GEMINI" | "RULE_BASED";
    }>("/complaints/analyze", { method: "POST", body: JSON.stringify(data) }),

  createComplaint: (data: CreateComplaintInput) =>
    request<ComplaintDto>("/complaints", { method: "POST", body: JSON.stringify(data) }),

  getComplaintByCode: (trackingCode: string) =>
    request<ComplaintDto>(`/complaints/track/${encodeURIComponent(trackingCode)}`),

  listComplaints: (params: Record<string, unknown> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    return request<{ items: ComplaintDto[]; total: number; page: number; totalPages: number }>(
      `/complaints?${query.toString()}`,
    );
  },

  getNearby: (lat: number, lng: number, category?: string) => {
    const query = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (category) query.append("category", category);
    return request<
      Array<{
        id: string;
        trackingCode: string;
        title: string;
        description: string;
        category: string;
        status: string;
        distanceMeters: number;
        supportCount: number;
        imageUrl?: string | null;
        createdAt: string;
      }>
    >(`/complaints/nearby?${query.toString()}`);
  },

  supportComplaint: (id: string) =>
    request<{ success: boolean; supportCount: number; impactScore: number }>(
      `/complaints/${id}/support`,
      { method: "POST" },
    ),

  updateStatus: (id: string, data: UpdateStatusInput) =>
    request<ComplaintDto>(`/complaints/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  resolveComplaint: (id: string, data: ResolveComplaintInput) =>
    request<ComplaintDto>(`/complaints/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  confirmComplaint: (id: string) =>
    request<ComplaintDto>(`/complaints/${id}/confirm`, {
      method: "POST",
    }),

  reopenComplaint: (id: string, remarks?: string) =>
    request<ComplaintDto>(`/complaints/${id}/reopen`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    }),

  // Departments
  listDepartments: () => request<DepartmentDto[]>("/departments"),
  updateDepartmentSla: (id: string, slaHours: number) =>
    request<DepartmentDto>(`/departments/${id}/sla`, {
      method: "PATCH",
      body: JSON.stringify({ slaHours }),
    }),

  // Analytics
  getPublicStats: () => request<AnalyticsStatsDto>("/analytics/stats"),
  getHeatmapPoints: () =>
    request<
      Array<{
        id: string;
        trackingCode: string;
        title: string;
        category: string;
        priority: ComplaintPriority;
        status: string;
        impactScore: number;
        lat: number;
        lng: number;
        address?: string | null;
        createdAt: string;
      }>
    >("/analytics/heatmap"),

  // Image Upload helper
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API_BASE}/complaints/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || "Failed to upload photo");
    }
    return json.data.imageUrl;
  },
};
