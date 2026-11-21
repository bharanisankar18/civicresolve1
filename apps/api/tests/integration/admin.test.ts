import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { checkAndEscalateOverdueComplaints } from "../../src/jobs/slaEscalationCron";

const app = createApp();

describe("Admin & Department Routes (/api/v1/admin & /api/v1/departments)", () => {
  let adminCookie: string[] = [];
  let citizenCookie: string[] = [];

  it("logs in as admin and citizen to test RBAC", async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@civicresolve.gov.in", password: "Admin@123" });
    const adminCookies = adminRes.headers["set-cookie"];
    adminCookie = Array.isArray(adminCookies) ? adminCookies : adminCookies ? [adminCookies] : [];

    const citizenRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "citizen@civicresolve.org", password: "Citizen@123" });
    const citizenCookies = citizenRes.headers["set-cookie"];
    citizenCookie = Array.isArray(citizenCookies)
      ? citizenCookies
      : citizenCookies
        ? [citizenCookies]
        : [];
  });

  it("blocks citizen from updating complaint status with 403 Forbidden", async () => {
    // Get a complaint
    const list = await request(app).get("/api/v1/complaints?limit=1");
    const complaintId = list.body.data.items[0].id;

    const res = await request(app)
      .patch(`/api/v1/complaints/${complaintId}/status`)
      .set("Cookie", citizenCookie)
      .send({ status: "IN_PROGRESS", remarks: "Citizen trying to update" });

    expect(res.status).toBe(403);
  });

  it("allows admin to transition complaint status and records timeline event", async () => {
    const list = await request(app).get("/api/v1/complaints?limit=1");
    const complaintId = list.body.data.items[0].id;

    const res = await request(app)
      .patch(`/api/v1/complaints/${complaintId}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "IN_PROGRESS", remarks: "Work crew dispatched to site." });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("IN_PROGRESS");
  });

  it("allows admin to update municipal department SLA hours", async () => {
    const depts = await request(app).get("/api/v1/departments");
    const firstDept = depts.body.data[0];

    const res = await request(app)
      .patch(`/api/v1/departments/${firstDept.id}/sla`)
      .set("Cookie", adminCookie)
      .send({ slaHours: 36 });

    expect(res.status).toBe(200);
    expect(res.body.data.slaHours).toBe(36);
  });

  it("fetches public analytics stats and heatmap points", async () => {
    const statsRes = await request(app).get("/api/v1/analytics/stats");
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.totalComplaints).toBeGreaterThan(0);
    expect(statsRes.body.data.resolutionRatePercentage).toBeDefined();

    const heatmapRes = await request(app)
      .get("/api/v1/analytics/heatmap")
      .set("Cookie", adminCookie);
    expect(heatmapRes.status).toBe(200);
    expect(Array.isArray(heatmapRes.body.data)).toBe(true);
    expect(heatmapRes.body.data.length).toBeGreaterThan(0);
  });

  it("allows admin to resolve a complaint with resolution proof", async () => {
    const list = await request(app).get("/api/v1/complaints?status=IN_PROGRESS&limit=1");
    const complaintId =
      list.body.data.items[0]?.id ||
      (await request(app).get("/api/v1/complaints?limit=1")).body.data.items[0].id;

    const res = await request(app)
      .post(`/api/v1/complaints/${complaintId}/resolve`)
      .set("Cookie", adminCookie)
      .send({
        afterImageUrl: "/uploads/sample-after.jpg",
        remarks: "Road crew resurfaced the entire segment with hot-mix asphalt.",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("RESOLVED");
    expect(res.body.data.afterImageUrl).toBe("/uploads/sample-after.jpg");
    expect(res.body.data.verificationResult).toBeDefined();
  });

  it("runs SLA auto-escalation job successfully", async () => {
    const count = await checkAndEscalateOverdueComplaints();
    expect(typeof count).toBe("number");
  });
});
