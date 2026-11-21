import { describe, it, expect } from "vitest";
import {
  calculateImpactScore,
  calculatePoiProximity,
} from "../../src/modules/ai/fallbackClassifier";

describe("Explainable Impact Score Engine - Comprehensive Unit Tests", () => {
  describe("POI Proximity Calculations (Hospitals & Schools)", () => {
    it("identifies no nearby hospital or school when far away (score = 0)", () => {
      // Location in rural outskirts far from Coimbatore city center
      const res = calculatePoiProximity(11.35, 76.55);
      expect(res.score).toBe(0);
      expect(res.nearestPoiName).toBeUndefined();
      expect(res.distanceMeters).toBeUndefined();
    });

    it("awards 25 points when near a hospital (<200m, PSG Hospitals)", () => {
      // PSG Hospitals is at lat: 11.0267, lng: 77.0028
      const res = calculatePoiProximity(11.0268, 77.0029);
      expect(res.score).toBe(25);
      expect(res.nearestPoiName).toContain("PSG Hospitals");
      expect(res.distanceMeters).toBeLessThanOrEqual(200);
    });

    it("awards 15 points when within 200m-500m of a hospital (Ganga Hospital)", () => {
      // Ganga Hospital is at lat: 11.0183, lng: 76.9587
      // Position ~350m away
      const res = calculatePoiProximity(11.0212, 76.9587);
      expect(res.score).toBe(15);
      expect(res.nearestPoiName).toContain("Ganga Hospital");
      expect(res.distanceMeters).toBeGreaterThan(200);
      expect(res.distanceMeters).toBeLessThanOrEqual(500);
    });

    it("awards 5 points when within 500m-1000m of a hospital (KMCH)", () => {
      // KMCH is at lat: 11.0475, lng: 77.0378
      // Position ~750m away
      const res = calculatePoiProximity(11.0535, 77.0378);
      expect(res.score).toBe(5);
      expect(res.nearestPoiName).toContain("KMCH");
      expect(res.distanceMeters).toBeGreaterThan(500);
      expect(res.distanceMeters).toBeLessThanOrEqual(1000);
    });

    it("awards 25 points when near a school (<200m, Stanes Anglo Indian HSS)", () => {
      // Stanes is at lat: 11.0118, lng: 76.9735
      const res = calculatePoiProximity(11.0119, 76.9736);
      expect(res.score).toBe(25);
      expect(res.nearestPoiName).toContain("Stanes Anglo Indian");
      expect(res.distanceMeters).toBeLessThanOrEqual(200);
    });

    it("awards 15 points when within 200m-500m of a school (Lisieux Matriculation)", () => {
      // Lisieux is at lat: 11.0289, lng: 76.9421
      const res = calculatePoiProximity(11.0315, 76.9421);
      expect(res.score).toBe(15);
      expect(res.nearestPoiName).toContain("Lisieux Matriculation");
      expect(res.distanceMeters).toBeGreaterThan(200);
      expect(res.distanceMeters).toBeLessThanOrEqual(500);
    });
  });

  describe("Impact Score Factor Variations & Edge Boundaries", () => {
    it("handles high safety hazard without POI or support (hazard = 25)", () => {
      const res = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 25,
        lat: 11.3,
        lng: 76.5,
      });

      expect(res.breakdown.safetyHazard).toBe(25);
      expect(res.breakdown.urgency).toBe(10);
      expect(res.breakdown.poiProximity).toBe(0);
      expect(res.breakdown.supportBoost).toBe(0);
      expect(res.breakdown.ageBoost).toBe(0);
      expect(res.impactScore).toBe(35);
    });

    it("correctly computes multiple supporters scaling up to 10-point cap", () => {
      // 0 supporters -> 0 pts
      const res0 = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 10,
        lat: 11.3,
        lng: 76.5,
        supportCount: 0,
      });
      expect(res0.breakdown.supportBoost).toBe(0);

      // 1 supporter -> 2 pts
      const res1 = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 10,
        lat: 11.3,
        lng: 76.5,
        supportCount: 1,
      });
      expect(res1.breakdown.supportBoost).toBe(2);

      // 3 supporters -> 6 pts
      const res3 = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 10,
        lat: 11.3,
        lng: 76.5,
        supportCount: 3,
      });
      expect(res3.breakdown.supportBoost).toBe(6);

      // 5 supporters -> 10 pts
      const res5 = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 10,
        lat: 11.3,
        lng: 76.5,
        supportCount: 5,
      });
      expect(res5.breakdown.supportBoost).toBe(10);

      // 10 supporters -> 10 pts (capped)
      const res10 = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 10,
        lat: 11.3,
        lng: 76.5,
        supportCount: 10,
      });
      expect(res10.breakdown.supportBoost).toBe(10);

      // 50 supporters -> 10 pts (capped)
      const res50 = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 10,
        lat: 11.3,
        lng: 76.5,
        supportCount: 50,
      });
      expect(res50.breakdown.supportBoost).toBe(10);
    });

    it("correctly scales age boost for old unresolved complaints up to 10-point cap", () => {
      const now = Date.now();

      // 6 hours old -> 0 pts (floor(6/12))
      const res6h = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 10,
        lat: 11.3,
        lng: 76.5,
        createdAt: new Date(now - 6 * 3600 * 1000),
      });
      expect(res6h.breakdown.ageBoost).toBe(0);

      // 12 hours old -> 1 pt
      const res12h = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 10,
        lat: 11.3,
        lng: 76.5,
        createdAt: new Date(now - 12 * 3600 * 1000),
      });
      expect(res12h.breakdown.ageBoost).toBe(1);

      // 48 hours old -> 4 pts
      const res48h = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 10,
        lat: 11.3,
        lng: 76.5,
        createdAt: new Date(now - 48 * 3600 * 1000),
      });
      expect(res48h.breakdown.ageBoost).toBe(4);

      // 140 hours old -> 10 pts (capped)
      const res140h = calculateImpactScore({
        urgencyScore: 10,
        safetyHazardScore: 10,
        lat: 11.3,
        lng: 76.5,
        createdAt: new Date(now - 140 * 3600 * 1000),
      });
      expect(res140h.breakdown.ageBoost).toBe(10);
    });

    it("evaluates low urgency complaints accurately", () => {
      const res = calculateImpactScore({
        urgencyScore: 2,
        safetyHazardScore: 4,
        lat: 11.3,
        lng: 76.5,
        supportCount: 0,
      });

      expect(res.breakdown.urgency).toBe(2);
      expect(res.breakdown.safetyHazard).toBe(4);
      expect(res.impactScore).toBe(6);
    });

    it("strictly caps score at maximum 100 even with extreme overflow", () => {
      // 30 urgency + 25 hazard + 25 POI + 10 support + 10 age = 100
      // If urgency is 50 and hazard is 50:
      const res = calculateImpactScore({
        urgencyScore: 50,
        safetyHazardScore: 50,
        lat: 11.0267, // PSG Hospitals -> +25
        lng: 77.0028,
        supportCount: 20, // +10
        createdAt: new Date(Date.now() - 200 * 3600 * 1000), // +10
      });

      expect(res.impactScore).toBe(100);
      expect(res.breakdown.total).toBe(100);
    });

    it("strictly floors score at minimum 0", () => {
      const res = calculateImpactScore({
        urgencyScore: 0,
        safetyHazardScore: 0,
        lat: 11.3,
        lng: 76.5,
        supportCount: 0,
      });

      expect(res.impactScore).toBe(0);
      expect(res.breakdown.total).toBe(0);
    });

    it("resiliently sanitizes invalid input (negative numbers, NaN, undefined dates)", () => {
      const res = calculateImpactScore({
        urgencyScore: -15, // Negative -> clamped to 0
        safetyHazardScore: NaN, // NaN -> clamped to 0
        lat: NaN,
        lng: NaN,
        supportCount: -5, // Negative -> clamped to 0
        createdAt: new Date("invalid-date-string"),
      });

      expect(res.impactScore).toBe(0);
      expect(res.breakdown.urgency).toBe(0);
      expect(res.breakdown.safetyHazard).toBe(0);
      expect(res.breakdown.supportBoost).toBe(0);
      expect(res.breakdown.ageBoost).toBe(0);
      expect(res.breakdown.total).toBe(0);
    });
  });
});
