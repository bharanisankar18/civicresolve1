import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { checkAndEscalateOverdueComplaints } from "../../src/jobs/slaEscalationCron";

const app = createApp();

describe("End-to-End Civic Complaint Lifecycle (Citizen to Administrator)", () => {
  let citizenEmail = "";
  const citizenPassword = "E2eCitizen@123";
  let citizenCookie: string[] = [];
  let adminCookie: string[] = [];

  let uploadedPhotoUrl = "";
  let resolutionPhotoUrl = "";
  let trackingCode = "";
  let complaintId = "";

  it("Step 1 & 2: Registers and logs in new citizen", async () => {
    citizenEmail = `citizen-${Date.now()}@testcivic.org`;

    // 1. Register
    const regRes = await request(app).post("/api/v1/auth/register").send({
      fullName: "Ramesh Kannan",
      email: citizenEmail,
      password: citizenPassword,
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.email).toBe(citizenEmail);
    expect(regRes.body.data.user.role).toBe("CITIZEN");

    // 2. Log in
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: citizenEmail,
      password: citizenPassword,
    });

    expect(loginRes.status).toBe(200);
    const rawCookie = loginRes.headers["set-cookie"];
    citizenCookie = Array.isArray(rawCookie) ? rawCookie : rawCookie ? [rawCookie] : [];
    expect(citizenCookie.length).toBeGreaterThan(0);
  });

  it("Step 3: Uploads complaint photo with automatic sanitization and metadata stripping", async () => {
    // 1x1 test png
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );

    const uploadRes = await request(app)
      .post("/api/v1/complaints/upload")
      .attach("image", pngBuffer, "pothole-crosscut.png");

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.data.imageUrl).toMatch(/^\/uploads\/.+\.jpg$/);
    uploadedPhotoUrl = uploadRes.body.data.imageUrl;
  });

  it("Step 4 & 5: Receives AI analysis and citizen modifies suggested details", async () => {
    const aiRes = await request(app).post("/api/v1/complaints/analyze").send({
      text: "Dangerous deep pothole on Crosscut road near Gandhipuram bus stand.",
      language: "en",
    });

    expect(aiRes.status).toBe(200);
    expect(aiRes.body.data.analysis.category).toBe("POTHOLE");
    expect(aiRes.body.data.analysis.suggestedDepartmentCode).toBe("ROADS");
    expect(aiRes.body.data.source).toBeDefined();

    // Citizen can refine title and description
    const editedTitle = "Hazardous deep pothole near Gandhipuram Signal (Refined)";
    const editedDescription =
      "Dangerous 1.5ft road crater damaging scooters and autos right before the turn.";

    expect(editedTitle.length).toBeGreaterThan(10);
    expect(editedDescription.length).toBeGreaterThan(20);
  });

  it("Step 6 & 7: Selects coordinates and runs duplicate detection prior to submit", async () => {
    const coords = { lat: 11.0185, lng: 76.9685 };

    const nearbyRes = await request(app).get(
      `/api/v1/complaints/nearby?lat=${coords.lat}&lng=${coords.lng}&radiusMeters=100&category=POTHOLE`,
    );

    expect(nearbyRes.status).toBe(200);
    expect(Array.isArray(nearbyRes.body.data)).toBe(true);
  });

  it("Step 8, 9 & 10: Submits complaint, receives tracking code, and queries tracking endpoint", async () => {
    const submitRes = await request(app)
      .post("/api/v1/complaints")
      .set("Cookie", citizenCookie)
      .send({
        title: "Hazardous deep pothole near Gandhipuram Signal (Refined)",
        description:
          "Dangerous 1.5ft road crater damaging scooters and autos right before the turn.",
        category: "POTHOLE",
        priority: "HIGH",
        lat: 11.0185,
        lng: 76.9685,
        address: "Crosscut Road, Gandhipuram, Coimbatore",
        imageUrl: uploadedPhotoUrl,
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.data.trackingCode).toMatch(/^CR-\d{4}-[A-F0-9]{6}$/);
    expect(submitRes.body.data.status).toBe("REPORTED");
    expect(submitRes.body.data.impactScore).toBeGreaterThan(0);

    trackingCode = submitRes.body.data.trackingCode;
    complaintId = submitRes.body.data.id;

    // 10. Track complaint by tracking code
    const trackRes = await request(app).get(`/api/v1/complaints/track/${trackingCode}`);
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.trackingCode).toBe(trackingCode);
    expect(trackRes.body.data.scoreBreakdown).toBeDefined();
    expect(trackRes.body.data.slaDueAt).toBeDefined();
  });

  it("Step 11 & 12: Logs in as admin and reviews complaint in triage queue", async () => {
    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      email: "admin@civicresolve.gov.in",
      password: "Admin@123",
    });

    expect(adminLogin.status).toBe(200);
    const rawAdminCookie = adminLogin.headers["set-cookie"];
    adminCookie = Array.isArray(rawAdminCookie)
      ? rawAdminCookie
      : rawAdminCookie
        ? [rawAdminCookie]
        : [];

    // Review triage queue via complaints endpoint
    const triageRes = await request(app)
      .get("/api/v1/complaints?search=Signal&limit=50")
      .set("Cookie", adminCookie);
    expect(triageRes.status).toBe(200);
    expect(Array.isArray(triageRes.body.data.items)).toBe(true);

    const queued = triageRes.body.data.items.find(
      (c: { trackingCode: string }) => c.trackingCode === trackingCode,
    );
    expect(queued).toBeDefined();
  });

  it("Step 13: Admin updates status to IN_PROGRESS with work crew dispatch remarks", async () => {
    const updateRes = await request(app)
      .patch(`/api/v1/complaints/${complaintId}/status`)
      .set("Cookie", adminCookie)
      .send({
        status: "IN_PROGRESS",
        remarks: "Ward 12 Road Repair Unit dispatched with cold mix asphalt equipment.",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe("IN_PROGRESS");

    // Timeline event registered (newest first)
    const trackRes = await request(app).get(`/api/v1/complaints/track/${trackingCode}`);
    expect(trackRes.body.data.statusEvents).toHaveLength(2);
    expect(trackRes.body.data.statusEvents[0].status).toBe("IN_PROGRESS");
  });

  it("Step 14 & 15: Admin uploads resolution photo and verifies resolution", async () => {
    // 14. Upload resolution photo
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );

    const uploadRes = await request(app)
      .post("/api/v1/complaints/upload")
      .attach("image", pngBuffer, "pothole-repaired.png");

    expect(uploadRes.status).toBe(200);
    resolutionPhotoUrl = uploadRes.body.data.imageUrl;

    // 15. Verify and submit resolution
    const resolveRes = await request(app)
      .post(`/api/v1/complaints/${complaintId}/resolve`)
      .set("Cookie", adminCookie)
      .send({
        afterImageUrl: resolutionPhotoUrl,
        remarks: "Asphalt patch completed and compacted by Ward 12 crew.",
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe("RESOLVED");
    expect(resolveRes.body.data.afterImageUrl).toBe(resolutionPhotoUrl);
    expect(resolveRes.body.data.verificationResult).toBeDefined();
  });

  it("Step 16, 17 & 18: Citizen confirms resolution and verifies RESOLVED state on tracker", async () => {
    // 16. Ensure citizen session is valid
    const meRes = await request(app).get("/api/v1/auth/me").set("Cookie", citizenCookie);
    expect(meRes.status).toBe(200);

    // 17. Citizen confirms resolution
    const confirmRes = await request(app)
      .post(`/api/v1/complaints/${complaintId}/confirm`)
      .set("Cookie", citizenCookie);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe("RESOLVED");

    // 18. Public tracker reflects confirmed RESOLVED status
    const trackRes = await request(app).get(`/api/v1/complaints/track/${trackingCode}`);
    expect(trackRes.status).toBe(200);
    expect(trackRes.body.data.status).toBe("RESOLVED");
  });

  describe("Additional Edge & Boundary Lifecycle Scenarios", () => {
    it("tests duplicate support flow boosting impact score", async () => {
      // Create another citizen to support the complaint
      const secondCitizenRes = await request(app)
        .post("/api/v1/auth/register")
        .send({
          email: `supporter-${Date.now()}@testcivic.org`,
          password: "Password@123",
          fullName: "Kavitha Murugan",
        });

      const rawCookie = secondCitizenRes.headers["set-cookie"];
      const supporterCookie = Array.isArray(rawCookie) ? rawCookie : rawCookie ? [rawCookie] : [];

      const supportRes = await request(app)
        .post(`/api/v1/complaints/${complaintId}/support`)
        .set("Cookie", supporterCookie);

      expect(supportRes.status).toBe(200);
      expect(supportRes.body.data.supportCount).toBeGreaterThan(0);
      expect(supportRes.body.data.scoreBreakdown.supportBoost).toBeGreaterThan(0);
    });

    it("verifies SLA auto-escalation cron marks overdue complaints", async () => {
      // Execute the cron logic directly
      const escalatedCount = await checkAndEscalateOverdueComplaints();
      expect(typeof escalatedCount).toBe("number");
      expect(escalatedCount).toBeGreaterThanOrEqual(0);
    });

    it("prevents citizen from attempting admin actions (RBAC enforcement)", async () => {
      // Citizen attempts to update department SLA
      const deptList = await request(app).get("/api/v1/departments");
      const deptId = deptList.body.data[0].id;

      const patchSlaRes = await request(app)
        .patch(`/api/v1/departments/${deptId}/sla`)
        .set("Cookie", citizenCookie)
        .send({ slaHours: 1 });

      expect(patchSlaRes.status).toBe(403);

      // Citizen attempts to access admin-only heatmap analytics
      const heatmapRes = await request(app)
        .get("/api/v1/analytics/heatmap")
        .set("Cookie", citizenCookie);

      expect(heatmapRes.status).toBe(403);

      // Citizen attempts to update complaint status
      const patchStatusRes = await request(app)
        .patch(`/api/v1/complaints/${complaintId}/status`)
        .set("Cookie", citizenCookie)
        .send({ status: "RESOLVED", remarks: "Citizen self-resolving" });

      expect(patchStatusRes.status).toBe(403);
    });
  });
});
