import { describe, it, expect } from "vitest";
import {
  calculateSlaDueDate,
  isSlaBreached,
  getRemainingSlaHours,
} from "../../src/utils/slaCalculator";

describe("SLA Calculator Utility - Comprehensive Unit Tests", () => {
  const baseTime = new Date("2026-05-01T10:00:00.000Z");

  describe("calculateSlaDueDate across Departments", () => {
    it("calculates accurate target due date for ROADS department (48h)", () => {
      const due = calculateSlaDueDate(baseTime, 48);
      expect(due.toISOString()).toBe("2026-05-03T10:00:00.000Z");
    });

    it("calculates accurate target due date for SANITATION department (24h)", () => {
      const due = calculateSlaDueDate(baseTime, 24);
      expect(due.toISOString()).toBe("2026-05-02T10:00:00.000Z");
    });

    it("calculates accurate target due date for ELECTRICAL department (24h)", () => {
      const due = calculateSlaDueDate(baseTime, 24);
      expect(due.toISOString()).toBe("2026-05-02T10:00:00.000Z");
    });

    it("calculates accurate target due date for WATER_DRAINAGE department (36h)", () => {
      const due = calculateSlaDueDate(baseTime, 36);
      expect(due.toISOString()).toBe("2026-05-02T22:00:00.000Z");
    });

    it("supports custom department SLA hours (12h, 72h, 96h)", () => {
      expect(calculateSlaDueDate(baseTime, 12).toISOString()).toBe("2026-05-01T22:00:00.000Z");
      expect(calculateSlaDueDate(baseTime, 72).toISOString()).toBe("2026-05-04T10:00:00.000Z");
      expect(calculateSlaDueDate(baseTime, 96).toISOString()).toBe("2026-05-05T10:00:00.000Z");
    });
  });

  describe("SLA Breach & Status Evaluation", () => {
    const dueTime = new Date("2026-05-03T10:00:00.000Z");

    it("evaluates complaint before deadline as NOT breached", () => {
      const beforeTime = new Date("2026-05-02T10:00:00.000Z"); // 24h prior
      expect(isSlaBreached(dueTime, "REPORTED", beforeTime)).toBe(false);
      expect(isSlaBreached(dueTime, "IN_PROGRESS", beforeTime)).toBe(false);
      expect(getRemainingSlaHours(dueTime, beforeTime)).toBe(24);
    });

    it("evaluates complaint exactly at deadline as NOT breached", () => {
      const exactTime = new Date("2026-05-03T10:00:00.000Z");
      expect(isSlaBreached(dueTime, "REPORTED", exactTime)).toBe(false);
      expect(getRemainingSlaHours(dueTime, exactTime)).toBe(0);
    });

    it("evaluates complaint after deadline as breached", () => {
      const afterTime = new Date("2026-05-03T12:00:00.000Z"); // 2h past
      expect(isSlaBreached(dueTime, "REPORTED", afterTime)).toBe(true);
      expect(isSlaBreached(dueTime, "IN_PROGRESS", afterTime)).toBe(true);
      expect(isSlaBreached(dueTime, "ESCALATED", afterTime)).toBe(true);
      expect(getRemainingSlaHours(dueTime, afterTime)).toBe(-2);
    });

    it("never flags already RESOLVED complaint as breached even long after deadline", () => {
      const longPastTime = new Date("2026-05-10T10:00:00.000Z"); // 1 week past
      expect(isSlaBreached(dueTime, "RESOLVED", longPastTime)).toBe(false);
    });

    it("never flags already REJECTED complaint as breached even long after deadline", () => {
      const longPastTime = new Date("2026-05-10T10:00:00.000Z");
      expect(isSlaBreached(dueTime, "REJECTED", longPastTime)).toBe(false);
    });
  });
});
