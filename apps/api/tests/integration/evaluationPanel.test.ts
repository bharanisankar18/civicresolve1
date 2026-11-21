import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("Evaluation Panel Adversarial Security & Quality Suite", () => {
  let adminCookie: string[] = [];
  let citizenACookie: string[] = [];
  let citizenBCookie: string[] = [];
  let citizenAId = "";

  beforeAll(async () => {
    // 1. Login Admin
    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      email: "admin@civicresolve.gov.in",
      password: "Admin@123",
    });
    const rawAdminCookie = adminLogin.headers["set-cookie"];
    adminCookie = Array.isArray(rawAdminCookie)
      ? rawAdminCookie
      : rawAdminCookie
        ? [rawAdminCookie]
        : [];

    // 2. Register/Login Citizen A
    const citizenAEmail = `citizen_a_${Date.now()}@test.org`;
    const citizenAReg = await request(app).post("/api/v1/auth/register").send({
      fullName: "Citizen Alice",
      email: citizenAEmail,
      password: "AlicePassword@123",
    });
    citizenAId = citizenAReg.body.data.user.id;
    const rawCitizenACookie = citizenAReg.headers["set-cookie"];
    citizenACookie = Array.isArray(rawCitizenACookie)
      ? rawCitizenACookie
      : rawCitizenACookie
        ? [rawCitizenACookie]
        : [];

    // 3. Register/Login Citizen B
    const citizenBEmail = `citizen_b_${Date.now()}@test.org`;
    const citizenBReg = await request(app).post("/api/v1/auth/register").send({
      fullName: "Citizen Bob",
      email: citizenBEmail,
      password: "BobPassword@123",
    });
    const rawCitizenBCookie = citizenBReg.headers["set-cookie"];
    citizenBCookie = Array.isArray(rawCitizenBCookie)
      ? rawCitizenBCookie
      : rawCitizenBCookie
        ? [rawCitizenBCookie]
        : [];
  });

  describe("Parameter 1: Status State Machine Hardening", () => {
    let testComplaintId = "";

    it("creates a fresh complaint in REPORTED status", async () => {
      const res = await request(app).post("/api/v1/complaints").set("Cookie", citizenACookie).send({
        title: "Large sinkhole opening near main boulevard",
        description: "Dangerous sinkhole expanding rapidly near pedestrian intersection.",
        category: "BAD_ROAD",
        priority: "CRITICAL",
        lat: 13.0827,
        lng: 80.2707,
        address: "Poonamallee High Road, Chennai",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("REPORTED");
      testComplaintId = res.body.data.id;
    });

    it("rejects direct PATCH /status to RESOLVED with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${testComplaintId}/status`)
        .set("Cookie", adminCookie)
        .send({
          status: "RESOLVED",
          remarks: "Admin attempting to resolve without photo proof",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("Direct status update to RESOLVED is not permitted");
    });

    it("rejects illegal state transition (REPORTED -> ESCALATED directly) with 400 Bad Request", async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${testComplaintId}/status`)
        .set("Cookie", adminCookie)
        .send({
          status: "ESCALATED",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("Invalid status transition");
    });

    it("rejects redundant transition to the same status (REPORTED -> REPORTED)", async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${testComplaintId}/status`)
        .set("Cookie", adminCookie)
        .send({
          status: "REPORTED",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("Complaint is already in status 'REPORTED'");
    });

    it("allows valid state transition (REPORTED -> IN_PROGRESS)", async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${testComplaintId}/status`)
        .set("Cookie", adminCookie)
        .send({
          status: "IN_PROGRESS",
          remarks: "Highways department team dispatched to inspect roadbed.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("IN_PROGRESS");
    });

    it("resolves grievance legitimately through /resolve endpoint with photo evidence", async () => {
      const res = await request(app)
        .post(`/api/v1/complaints/${testComplaintId}/resolve`)
        .set("Cookie", adminCookie)
        .send({
          afterImageUrl: "/uploads/resolved-sinkhole.jpg",
          remarks: "Filled with concrete aggregate and repaved.",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("RESOLVED");
    });

    it("rejects arbitrary status update when grievance is already RESOLVED", async () => {
      const res = await request(app)
        .patch(`/api/v1/complaints/${testComplaintId}/status`)
        .set("Cookie", adminCookie)
        .send({
          status: "IN_PROGRESS",
          remarks: "Attempting to change status of terminal resolved grievance",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain("Complaint is already RESOLVED");
    });
  });

  describe("Parameter 2: BOLA / IDOR Verification on Citizen Actions", () => {
    let resolvedComplaintId = "";

    beforeAll(async () => {
      // Create a private grievance belonging to Citizen A
      const createRes = await request(app)
        .post("/api/v1/complaints")
        .set("Cookie", citizenACookie)
        .send({
          title: "Overhead electric cable snapped in front of house",
          description: "Live wire sparking on metal gate, immediate electrocution hazard.",
          category: "STREETLIGHT",
          priority: "CRITICAL",
          lat: 13.085,
          lng: 80.275,
          address: "Kilpauk Garden Road, Chennai",
        });

      resolvedComplaintId = createRes.body.data.id;
      expect(createRes.body.data.citizenId).toBe(citizenAId);

      // Admin resolves the grievance
      await request(app)
        .post(`/api/v1/complaints/${resolvedComplaintId}/resolve`)
        .set("Cookie", adminCookie)
        .send({
          afterImageUrl: "/uploads/fixed-wire.jpg",
          remarks: "Linemen safely reconnected and insulated high-voltage conductor.",
        });
    });

    it("blocks unauthenticated user from confirming another citizen's grievance with 401", async () => {
      const res = await request(app).post(`/api/v1/complaints/${resolvedComplaintId}/confirm`);

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain("Authentication required");
    });

    it("blocks Citizen B from confirming Citizen A's grievance with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/v1/complaints/${resolvedComplaintId}/confirm`)
        .set("Cookie", citizenBCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain("You cannot confirm another citizen's grievance");
    });

    it("blocks unauthenticated user from reopening another citizen's grievance with 401", async () => {
      const res = await request(app)
        .post(`/api/v1/complaints/${resolvedComplaintId}/reopen`)
        .send({ remarks: "Wire still hanging loose" });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain("Authentication required");
    });

    it("blocks Citizen B from reopening Citizen A's grievance with 403 Forbidden", async () => {
      const res = await request(app)
        .post(`/api/v1/complaints/${resolvedComplaintId}/reopen`)
        .set("Cookie", citizenBCookie)
        .send({ remarks: "Wire still hanging loose" });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain("You cannot reopen another citizen's grievance");
    });

    it("allows Citizen A (owner) to successfully confirm their own resolved grievance", async () => {
      const res = await request(app)
        .post(`/api/v1/complaints/${resolvedComplaintId}/confirm`)
        .set("Cookie", citizenACookie);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("RESOLVED");
    });

    it("allows Citizen A (owner) to reopen their grievance if dissatisfaction arises", async () => {
      const res = await request(app)
        .post(`/api/v1/complaints/${resolvedComplaintId}/reopen`)
        .set("Cookie", citizenACookie)
        .send({ remarks: "Insulation peeled off and sparks returned during rain." });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("IN_PROGRESS");
      expect(res.body.data.isEscalated).toBe(true);
    });
  });

  describe("Parameter 3: Atomic Support & Dynamic Scoring", () => {
    it("atomically boosts support count and impact score in database transaction", async () => {
      // 1. Create a fresh complaint
      const res = await request(app).post("/api/v1/complaints").set("Cookie", citizenACookie).send({
        title: "Broken stormwater drain cover",
        description: "Open slab on walking path.",
        category: "DRAINAGE",
        priority: "MEDIUM",
        lat: 13.08,
        lng: 80.27,
        address: "Egmore, Chennai",
      });

      const compId = res.body.data.id;
      const initialScore = res.body.data.impactScore;
      const initialBreakdown = res.body.data.scoreBreakdown;

      // 2. Citizen B supports
      const supportRes = await request(app)
        .post(`/api/v1/complaints/${compId}/support`)
        .set("Cookie", citizenBCookie);

      expect(supportRes.status).toBe(200);
      expect(supportRes.body.data.supportCount).toBe(1);
      expect(supportRes.body.data.impactScore).toBeGreaterThanOrEqual(initialScore);
      expect(supportRes.body.data.scoreBreakdown.supportBoost).toBe(2);

      // 3. Verify fetched complaint reflects the atomic update
      const fetchRes = await request(app).get(
        `/api/v1/complaints/track/${res.body.data.trackingCode}`,
      );
      expect(fetchRes.status).toBe(200);
      expect(fetchRes.body.data.supportCount).toBe(1);
      expect(fetchRes.body.data.scoreBreakdown.supportBoost).toBe(2);
      expect(fetchRes.body.data.impactScore).toBe(
        initialScore + (2 - initialBreakdown.supportBoost),
      );
    });
  });
});
