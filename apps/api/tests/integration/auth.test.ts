import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("Auth Integration Routes (/api/v1/auth)", () => {
  const testUser = {
    fullName: "Integration Citizen",
    email: `citizen_${Date.now()}@test.org`,
    password: "Password@123",
  };

  it("registers a new citizen account and returns cookie + user dto", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.role).toBe("CITIZEN");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("forces role to CITIZEN even if caller attempts privilege escalation with role=ADMIN", async () => {
    const maliciousPayload = {
      fullName: "Hacker User",
      email: `hacker_${Date.now()}@example.com`,
      password: "Password@123",
      role: "ADMIN",
    };

    const res = await request(app).post("/api/v1/auth/register").send(maliciousPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe("CITIZEN");
  });

  it("rejects registration with existing email with 409 Conflict", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("logs in successfully with seeded admin credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "admin@civicresolve.gov.in",
      password: "Admin@123",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("ADMIN");
    expect(res.body.data.token).toBeDefined();
  });

  it("returns 401 Unauthorized for incorrect password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "admin@civicresolve.gov.in",
      password: "WrongPassword",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("authenticates user profile via GET /api/v1/auth/me", async () => {
    // First login
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "admin@civicresolve.gov.in",
      password: "Admin@123",
    });

    const rawCookie = loginRes.headers["set-cookie"];
    const cookie = Array.isArray(rawCookie) ? rawCookie : rawCookie ? [rawCookie] : [];

    const meRes = await request(app).get("/api/v1/auth/me").set("Cookie", cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe("admin@civicresolve.gov.in");

    // Test logout
    const logoutRes = await request(app).post("/api/v1/auth/logout").set("Cookie", cookie);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });

  it("rejects /api/v1/auth/me when unauthenticated or with invalid token", async () => {
    const unauthRes = await request(app).get("/api/v1/auth/me");
    expect(unauthRes.status).toBe(401);

    const invalidRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid-jwt-token");
    expect(invalidRes.status).toBe(401);
  });
});
