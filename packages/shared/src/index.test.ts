import { describe, it, expect } from "vitest";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  COIMBATORE_POIS,
  DEFAULT_DEPARTMENTS,
} from "./index";

describe("Shared Constants and Configs", () => {
  it("defines the 6 required civic grievance categories", () => {
    expect(COMPLAINT_CATEGORIES).toEqual([
      "POTHOLE",
      "GARBAGE",
      "STREETLIGHT",
      "WATER_LEAKAGE",
      "BAD_ROAD",
      "DRAINAGE",
    ]);
  });

  it("defines standard complaint lifecycle statuses", () => {
    expect(COMPLAINT_STATUSES).toContain("REPORTED");
    expect(COMPLAINT_STATUSES).toContain("IN_PROGRESS");
    expect(COMPLAINT_STATUSES).toContain("RESOLVED");
    expect(COMPLAINT_STATUSES).toContain("ESCALATED");
  });

  it("contains seeded Coimbatore sensitive POIs (Hospitals & Schools)", () => {
    expect(COIMBATORE_POIS.length).toBeGreaterThanOrEqual(5);
    const hospitals = COIMBATORE_POIS.filter((p) => p.type === "HOSPITAL");
    const schools = COIMBATORE_POIS.filter((p) => p.type === "SCHOOL");
    expect(hospitals.length).toBeGreaterThan(0);
    expect(schools.length).toBeGreaterThan(0);
  });

  it("defines default department SLAs with realistic target hours", () => {
    expect(DEFAULT_DEPARTMENTS.length).toBe(4);
    const roads = DEFAULT_DEPARTMENTS.find((d) => d.code === "ROADS");
    expect(roads?.slaHours).toBe(48);
  });
});
