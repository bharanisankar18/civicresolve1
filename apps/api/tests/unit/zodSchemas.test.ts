import { describe, it, expect } from "vitest";
import {
  RegisterSchema,
  CreateComplaintSchema,
  NearbyQuerySchema,
  UpdateDepartmentSlaSchema,
} from "@civicresolve/shared";

describe("Shared Zod Schemas Validation", () => {
  it("validates correct registration payload", () => {
    const valid = RegisterSchema.safeParse({
      fullName: "Ganesh Moorthy",
      email: "ganesh@example.com",
      password: "StrongPassword123",
      role: "CITIZEN",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid email and short password", () => {
    const invalid = RegisterSchema.safeParse({
      fullName: "G",
      email: "not-an-email",
      password: "123",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates complaint creation schema with coordinate boundaries", () => {
    const valid = CreateComplaintSchema.safeParse({
      title: "Pothole on 100 feet road",
      description: "Severe road cavity causing vehicular vibration",
      category: "POTHOLE",
      priority: "HIGH",
      lat: 11.0168,
      lng: 76.9558,
      address: "Gandhipuram, Coimbatore",
    });
    expect(valid.success).toBe(true);

    const invalidCoords = CreateComplaintSchema.safeParse({
      title: "Test",
      description: "Test description is long enough",
      category: "POTHOLE",
      lat: 195, // out of range
      lng: 76,
    });
    expect(invalidCoords.success).toBe(false);
  });

  it("validates NearbyQuerySchema with default radius 100 meters", () => {
    const parsed = NearbyQuerySchema.parse({
      lat: "11.0168",
      lng: "76.9558",
    });
    expect(parsed.lat).toBe(11.0168);
    expect(parsed.lng).toBe(76.9558);
    expect(parsed.radiusMeters).toBe(100);
  });

  it("validates department SLA hour bounds", () => {
    expect(UpdateDepartmentSlaSchema.safeParse({ slaHours: 24 }).success).toBe(true);
    expect(UpdateDepartmentSlaSchema.safeParse({ slaHours: 0 }).success).toBe(false);
    expect(UpdateDepartmentSlaSchema.safeParse({ slaHours: 1000 }).success).toBe(false);
  });
});
