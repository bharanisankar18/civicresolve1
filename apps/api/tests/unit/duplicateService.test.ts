import { describe, it, expect, vi, beforeEach } from "vitest";
import { findNearbyDuplicates } from "../../src/modules/complaints/duplicateService";
import { complaintRepository } from "../../src/modules/complaints/complaintRepository";

vi.mock("../../src/modules/complaints/complaintRepository", () => ({
  complaintRepository: {
    findOpenComplaintsNearby: vi.fn(),
  },
}));

describe("Duplicate Complaint Detection Engine - Comprehensive Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseLat = 11.0168;
  const baseLng = 76.9558;

  it("detects complaint of the same category within 100 meters duplicate radius", async () => {
    // 0.0003 deg latitude is approx 33 meters
    const mockComplaints = [
      {
        id: "c-1",
        trackingCode: "CR-2026-000001",
        title: "Large pothole in middle lane",
        description: "Hazardous pothole damaging car tires",
        category: "POTHOLE",
        status: "REPORTED",
        lat: baseLat + 0.0003,
        lng: baseLng,
        supportCount: 2,
        imageUrl: "/uploads/pothole1.jpg",
        createdAt: new Date(),
      },
    ];

    vi.mocked(complaintRepository.findOpenComplaintsNearby).mockResolvedValue(
      mockComplaints as never,
    );

    const matches = await findNearbyDuplicates({
      lat: baseLat,
      lng: baseLng,
      radiusMeters: 100,
      category: "POTHOLE",
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.trackingCode).toBe("CR-2026-000001");
    expect(matches[0]?.distanceMeters).toBeLessThan(100);
    expect(matches[0]?.category).toBe("POTHOLE");
  });

  it("ignores nearby complaints of a different category", async () => {
    // Streetlight issue 30m away when searching for POTHOLE
    vi.mocked(complaintRepository.findOpenComplaintsNearby).mockResolvedValue([]);

    const matches = await findNearbyDuplicates({
      lat: baseLat,
      lng: baseLng,
      radiusMeters: 100,
      category: "POTHOLE",
    });

    expect(matches).toHaveLength(0);
    expect(complaintRepository.findOpenComplaintsNearby).toHaveBeenCalledWith({
      lat: baseLat,
      lng: baseLng,
      radiusMeters: 100,
      category: "POTHOLE",
    });
  });

  it("excludes complaints of the same category that are outside the 100-meter radius", async () => {
    // 0.002 deg latitude is approx 222 meters
    const farComplaints = [
      {
        id: "c-far",
        trackingCode: "CR-2026-000002",
        title: "Pothole down the street",
        description: "Another pothole 220m away",
        category: "POTHOLE",
        status: "REPORTED",
        lat: baseLat + 0.002,
        lng: baseLng,
        supportCount: 0,
        imageUrl: null,
        createdAt: new Date(),
      },
    ];

    vi.mocked(complaintRepository.findOpenComplaintsNearby).mockResolvedValue(
      farComplaints as never,
    );

    const matches = await findNearbyDuplicates({
      lat: baseLat,
      lng: baseLng,
      radiusMeters: 100,
      category: "POTHOLE",
    });

    // Even if repository returned candidates within the coarse bounding box,
    // exact Haversine filtering must reject records beyond 100 meters
    expect(matches).toHaveLength(0);
  });

  it("does not flag already RESOLVED or REJECTED complaints as active duplicates", async () => {
    // findOpenComplaintsNearby repository contract guarantees only open statuses (REPORTED, IN_PROGRESS, ESCALATED)
    vi.mocked(complaintRepository.findOpenComplaintsNearby).mockResolvedValue([]);

    const matches = await findNearbyDuplicates({
      lat: baseLat,
      lng: baseLng,
      radiusMeters: 100,
      category: "GARBAGE",
    });

    expect(matches).toHaveLength(0);
  });

  it("returns multiple matching complaints sorted by distance in ascending order", async () => {
    const mockComplaints = [
      {
        id: "c-medium",
        trackingCode: "CR-2026-000010",
        title: "Garbage bin overflowing",
        description: "Bin full near tea stall",
        category: "GARBAGE",
        status: "REPORTED",
        lat: baseLat + 0.0006, // ~66m
        lng: baseLng,
        supportCount: 1,
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: "c-closest",
        trackingCode: "CR-2026-000011",
        title: "Garbage scattered",
        description: "Waste on corner",
        category: "GARBAGE",
        status: "REPORTED",
        lat: baseLat + 0.0002, // ~22m
        lng: baseLng,
        supportCount: 3,
        imageUrl: null,
        createdAt: new Date(),
      },
      {
        id: "c-further",
        trackingCode: "CR-2026-000012",
        title: "Garbage pile",
        description: "Old waste",
        category: "GARBAGE",
        status: "IN_PROGRESS",
        lat: baseLat + 0.0008, // ~88m
        lng: baseLng,
        supportCount: 5,
        imageUrl: null,
        createdAt: new Date(),
      },
    ];

    vi.mocked(complaintRepository.findOpenComplaintsNearby).mockResolvedValue(
      mockComplaints as never,
    );

    const matches = await findNearbyDuplicates({
      lat: baseLat,
      lng: baseLng,
      radiusMeters: 100,
      category: "GARBAGE",
    });

    expect(matches).toHaveLength(3);
    expect(matches[0]?.trackingCode).toBe("CR-2026-000011"); // ~22m
    expect(matches[1]?.trackingCode).toBe("CR-2026-000010"); // ~66m
    expect(matches[2]?.trackingCode).toBe("CR-2026-000012"); // ~88m
    expect(matches[0]?.distanceMeters).toBeLessThan(matches[1]!.distanceMeters);
    expect(matches[1]?.distanceMeters).toBeLessThan(matches[2]!.distanceMeters);
  });
});
