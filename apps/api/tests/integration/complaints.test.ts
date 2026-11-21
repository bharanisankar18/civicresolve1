import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("Complaints Integration Routes (/api/v1/complaints)", () => {
  let createdTrackingCode = "";
  let createdId = "";

  it("creates a new complaint with Explainable Impact Score", async () => {
    const res = await request(app).post("/api/v1/complaints").send({
      title: "Deep road cavity on Trichy Road",
      description: "Dangerous pothole damaging vehicle rims near Ramanathapuram.",
      category: "POTHOLE",
      priority: "HIGH",
      lat: 10.9982,
      lng: 77.0011,
      address: "Ramanathapuram, Coimbatore",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trackingCode).toMatch(/^CR-\d{4}-[A-F0-9]{6}$/);
    expect(res.body.data.impactScore).toBeGreaterThan(0);
    expect(res.body.data.status).toBe("REPORTED");

    createdTrackingCode = res.body.data.trackingCode;
    createdId = res.body.data.id;
  });

  it("retrieves created complaint by tracking code", async () => {
    const res = await request(app).get(`/api/v1/complaints/track/${createdTrackingCode}`);

    expect(res.status).toBe(200);
    expect(res.body.data.trackingCode).toBe(createdTrackingCode);
    expect(res.body.data.scoreBreakdown).toBeDefined();
    expect(res.body.data.statusEvents).toHaveLength(1);
  });

  it("detects duplicate complaints within 100 meters", async () => {
    // Query near the exact coordinates of the created complaint
    const res = await request(app).get(
      `/api/v1/complaints/nearby?lat=10.9982&lng=77.0011&radiusMeters=100&category=POTHOLE`,
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const match = res.body.data.find(
      (c: { trackingCode: string; distanceMeters: number }) =>
        c.trackingCode === createdTrackingCode,
    );
    expect(match).toBeDefined();
    expect(match.distanceMeters).toBeLessThanOrEqual(5);
  });

  it("supports an existing complaint, boosting supportCount and impact score", async () => {
    // Login as citizen
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "citizen@civicresolve.org",
      password: "Citizen@123",
    });

    const rawCookie = loginRes.headers["set-cookie"];
    const cookie = Array.isArray(rawCookie) ? rawCookie : rawCookie ? [rawCookie] : [];

    const supportRes = await request(app)
      .post(`/api/v1/complaints/${createdId}/support`)
      .set("Cookie", cookie);

    expect(supportRes.status).toBe(200);
    expect(supportRes.body.data.supportCount).toBe(1);
    expect(supportRes.body.data.scoreBreakdown.supportBoost).toBe(2);
  });

  it("lists complaints with pagination and filters", async () => {
    const res = await request(app).get("/api/v1/complaints?page=1&limit=10&category=POTHOLE");

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  it("returns 404 for non-existent tracking code", async () => {
    const res = await request(app).get("/api/v1/complaints/track/CR-NON-EXISTENT");
    expect(res.status).toBe(404);
  });

  it("uploads and sanitizes an image attachment via /api/v1/complaints/upload", async () => {
    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );

    const res = await request(app)
      .post("/api/v1/complaints/upload")
      .attach("image", pngBuffer, "sample-defect.png");

    expect(res.status).toBe(200);
    expect(res.body.data.imageUrl).toMatch(/^\/uploads\/.+\.jpg$/);
  });

  it("allows citizen to confirm or reopen a resolved complaint", async () => {
    // 1. Login as admin to resolve the complaint
    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      email: "admin@civicresolve.gov.in",
      password: "Admin@123",
    });
    const rawAdminCookie = adminLogin.headers["set-cookie"];
    const adminCookie: string[] = Array.isArray(rawAdminCookie)
      ? rawAdminCookie
      : rawAdminCookie
        ? [rawAdminCookie]
        : [];

    const resolveRes = await request(app)
      .post(`/api/v1/complaints/${createdId}/resolve`)
      .set("Cookie", adminCookie)
      .send({
        afterImageUrl: "/uploads/proof-resolved.jpg",
        remarks: "Pothole filled with cold mix asphalt",
      });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe("RESOLVED");

    // 2. Citizen confirms resolution
    const confirmRes = await request(app).post(`/api/v1/complaints/${createdId}/confirm`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe("RESOLVED");

    // 3. Citizen reopens grievance
    const reopenRes = await request(app)
      .post(`/api/v1/complaints/${createdId}/reopen`)
      .send({ remarks: "Asphalt is already sinking again" });
    expect(reopenRes.status).toBe(200);
    expect(reopenRes.body.data.status).toBe("IN_PROGRESS");
    expect(reopenRes.body.data.isEscalated).toBe(true);
  });

  describe("API Security, Boundary & Failure Integrations", () => {
    it("rejects duplicate support attempts from the same citizen with 409 Conflict", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "citizen@civicresolve.org",
        password: "Citizen@123",
      });
      const rawCookie = loginRes.headers["set-cookie"];
      const cookie = Array.isArray(rawCookie) ? rawCookie : rawCookie ? [rawCookie] : [];

      // Second support attempt for the complaint created earlier
      const duplicateSupportRes = await request(app)
        .post(`/api/v1/complaints/${createdId}/support`)
        .set("Cookie", cookie);

      expect(duplicateSupportRes.status).toBe(409);
      expect(duplicateSupportRes.body.error.message).toContain("already supported");
    });

    it("rejects support endpoint when unauthenticated with 401 Unauthorized", async () => {
      const res = await request(app).post(`/api/v1/complaints/${createdId}/support`);
      expect(res.status).toBe(401);
    });

    it("rejects support endpoint with malformed/invalid token with 401 Unauthorized", async () => {
      const res = await request(app)
        .post(`/api/v1/complaints/${createdId}/support`)
        .set("Cookie", ["token=malformed.bearer.signature"]);
      expect(res.status).toBe(401);
    });

    it("rejects invalid complaint creation with 400 Bad Request (schema validation)", async () => {
      const res = await request(app).post("/api/v1/complaints").send({
        title: "Bad", // too short (min 5)
        description: "Short", // too short (min 10)
        category: "INVALID_CAT",
        lat: 95.0, // invalid latitude > 90
        lng: 200.0, // invalid longitude > 180
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toBeDefined();
    });

    it("rejects invalid status enum with 400 Bad Request", async () => {
      const adminLogin = await request(app).post("/api/v1/auth/login").send({
        email: "admin@civicresolve.gov.in",
        password: "Admin@123",
      });
      const rawCookie = adminLogin.headers["set-cookie"];
      const cookie = Array.isArray(rawCookie) ? rawCookie : rawCookie ? [rawCookie] : [];

      const res = await request(app)
        .patch(`/api/v1/complaints/${createdId}/status`)
        .set("Cookie", cookie)
        .send({ status: "DELETED_STATUS" });

      expect(res.status).toBe(400);
    });

    it("rejects non-image file uploads with 400 Unsupported file format", async () => {
      const textBuffer = Buffer.from(
        "Hello world, this is a plain text file, not an image.",
        "utf8",
      );

      const res = await request(app)
        .post("/api/v1/complaints/upload")
        .attach("image", textBuffer, "exploit.txt");

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("Unsupported file format or extension");
    });
  });
});
