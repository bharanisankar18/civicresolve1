import { describe, it, expect } from "vitest";
import { haversineDistanceMeters } from "../../src/utils/haversine";

describe("Haversine Distance Calculator - Comprehensive Unit Tests", () => {
  it("returns 0 meters for identical coordinates", () => {
    const dist = haversineDistanceMeters(11.0168, 76.9558, 11.0168, 76.9558);
    expect(dist).toBe(0);
  });

  it("calculates distance less than 100 meters (<100m duplicate radius)", () => {
    // 0.0004 deg latitude is approx 44 meters
    const lat1 = 11.0245;
    const lng1 = 77.0012;
    const lat2 = 11.0249;
    const lng2 = 77.0012;

    const dist = haversineDistanceMeters(lat1, lng1, lat2, lng2);
    expect(dist).toBeLessThan(100);
    expect(dist).toBeGreaterThan(40);
  });

  it("calculates distance approximately equal to 100 meters (boundary threshold)", () => {
    // 1 deg latitude ≈ 111,195 m.
    // 100 meters ≈ 100 / 111195 ≈ 0.00089932 deg
    const lat1 = 11.0;
    const lng1 = 77.0;
    const lat2 = 11.00089932;
    const lng2 = 77.0;

    const dist = haversineDistanceMeters(lat1, lng1, lat2, lng2);
    expect(dist).toBe(100);
  });

  it("calculates distance greater than 100 meters (>100m outside duplicate radius)", () => {
    // 0.002 deg latitude is approx 222 meters
    const lat1 = 11.0245;
    const lng1 = 77.0012;
    const lat2 = 11.0265;
    const lng2 = 77.0012;

    const dist = haversineDistanceMeters(lat1, lng1, lat2, lng2);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeCloseTo(222, -1);
  });

  it("handles invalid coordinates (NaN) gracefully returning NaN", () => {
    expect(haversineDistanceMeters(NaN, 76.95, 11.01, 76.95)).toBeNaN();
    expect(haversineDistanceMeters(11.01, NaN, 11.01, 76.95)).toBeNaN();
    expect(haversineDistanceMeters(11.01, 76.95, NaN, 76.95)).toBeNaN();
    expect(haversineDistanceMeters(11.01, 76.95, 11.01, NaN)).toBeNaN();
  });

  describe("Geographic Boundary Cases", () => {
    it("measures distance along the Equator (lat = 0)", () => {
      // 1 degree longitude at equator ≈ 111.195 km
      const dist = haversineDistanceMeters(0, 0, 0, 1);
      expect(dist).toBeGreaterThan(111000);
      expect(dist).toBeLessThan(112000);
    });

    it("measures distance along the Prime Meridian (lng = 0)", () => {
      // 1 degree latitude along prime meridian ≈ 111.195 km
      const dist = haversineDistanceMeters(0, 0, 1, 0);
      expect(dist).toBeGreaterThan(111000);
      expect(dist).toBeLessThan(112000);
    });

    it("measures distance near the North Pole (lat = 90 to 89)", () => {
      // 1 degree latitude near pole ≈ 111.195 km
      const dist = haversineDistanceMeters(90, 0, 89, 0);
      expect(dist).toBeGreaterThan(111000);
      expect(dist).toBeLessThan(112000);
    });

    it("measures distance near the South Pole (lat = -90 to -89)", () => {
      // 1 degree latitude near south pole ≈ 111.195 km
      const dist = haversineDistanceMeters(-90, 0, -89, 0);
      expect(dist).toBeGreaterThan(111000);
      expect(dist).toBeLessThan(112000);
    });

    it("measures antipodal points across the globe (~20,015 km)", () => {
      // Point (0, 0) and its antipode (0, 180) across the globe
      const dist = haversineDistanceMeters(0, 0, 0, 180);
      // Half circumference of Earth: pi * 6371 km ≈ 20,015 km
      expect(dist).toBeGreaterThan(20000000);
      expect(dist).toBeLessThan(20050000);
    });
  });
});
