import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { createApp } from "../../src/app";

interface LatencyStats {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  payloadBytes: number;
}

function calculatePercentiles(latencies: number[], payloadBytes: number): LatencyStats {
  const sorted = [...latencies].sort((a, b) => a - b);
  const n = sorted.length;
  const avg = Number((sorted.reduce((acc, val) => acc + val, 0) / (n || 1)).toFixed(2));
  const p50 = Number((sorted[Math.floor(n * 0.5)] ?? 0).toFixed(2));
  const p95 = Number((sorted[Math.min(Math.floor(n * 0.95), Math.max(0, n - 1))] ?? 0).toFixed(2));
  const p99 = Number((sorted[Math.min(Math.floor(n * 0.99), Math.max(0, n - 1))] ?? 0).toFixed(2));

  return {
    min: Number((sorted[0] ?? 0).toFixed(2)),
    max: Number((sorted[Math.max(0, n - 1)] ?? 0).toFixed(2)),
    avg,
    p50,
    p95,
    p99,
    payloadBytes,
  };
}

describe("Performance Benchmark - Latency & Response Profiles", () => {
  const app = createApp();
  let adminCookie: string[] = [];
  const benchmarkResults: Record<string, LatencyStats> = {};

  beforeAll(async () => {
    const adminRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "admin@civicresolve.gov.in", password: "Admin@123" });
    const rawCookie = adminRes.headers["set-cookie"];
    adminCookie = Array.isArray(rawCookie) ? rawCookie : rawCookie ? [rawCookie] : [];
  });

  it("benchmarks GET /api/v1/complaints?page=1&limit=20 (paginated listing)", async () => {
    const iterations = 30;
    const latencies: number[] = [];
    let payloadBytes = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await request(app).get("/api/v1/complaints?page=1&limit=20");
      const duration = performance.now() - start;

      expect(res.status).toBe(200);
      latencies.push(duration);
      if (i === 0) {
        payloadBytes = Buffer.byteLength(JSON.stringify(res.body), "utf8");
      }
    }

    const stats = calculatePercentiles(latencies, payloadBytes);
    benchmarkResults["GET /complaints (paginated)"] = stats;

    expect(stats.p95).toBeLessThan(150);
  });

  it("benchmarks GET /api/v1/complaints/nearby (spatial bounding box + Haversine)", async () => {
    const iterations = 30;
    const latencies: number[] = [];
    let payloadBytes = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await request(app).get(
        "/api/v1/complaints/nearby?lat=11.0168&lng=76.9558&radiusMeters=100&category=POTHOLE",
      );
      const duration = performance.now() - start;

      expect(res.status).toBe(200);
      latencies.push(duration);
      if (i === 0) {
        payloadBytes = Buffer.byteLength(JSON.stringify(res.body), "utf8");
      }
    }

    const stats = calculatePercentiles(latencies, payloadBytes);
    benchmarkResults["GET /complaints/nearby (spatial)"] = stats;

    expect(stats.p95).toBeLessThan(120);
  });

  it("benchmarks GET /api/v1/analytics/stats (in-memory cached public aggregates)", async () => {
    // Warm cache
    await request(app).get("/api/v1/analytics/stats");

    const iterations = 30;
    const latencies: number[] = [];
    let payloadBytes = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await request(app).get("/api/v1/analytics/stats");
      const duration = performance.now() - start;

      expect(res.status).toBe(200);
      latencies.push(duration);
      if (i === 0) {
        payloadBytes = Buffer.byteLength(JSON.stringify(res.body), "utf8");
      }
    }

    const stats = calculatePercentiles(latencies, payloadBytes);
    benchmarkResults["GET /analytics/stats (cached)"] = stats;

    expect(stats.p95).toBeLessThan(50);
  });

  it("benchmarks GET /api/v1/analytics/heatmap (in-memory cached geospatial points)", async () => {
    // Warm cache
    await request(app).get("/api/v1/analytics/heatmap").set("Cookie", adminCookie);

    const iterations = 30;
    const latencies: number[] = [];
    let payloadBytes = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await request(app).get("/api/v1/analytics/heatmap").set("Cookie", adminCookie);
      const duration = performance.now() - start;

      expect(res.status).toBe(200);
      latencies.push(duration);
      if (i === 0) {
        payloadBytes = Buffer.byteLength(JSON.stringify(res.body), "utf8");
      }
    }

    const stats = calculatePercentiles(latencies, payloadBytes);
    benchmarkResults["GET /analytics/heatmap (cached)"] = stats;

    expect(stats.p95).toBeLessThan(60);
  });

  it("benchmarks POST /api/v1/complaints (ingestion, score calculation, SLA binding)", async () => {
    const iterations = 10;
    const latencies: number[] = [];
    let payloadBytes = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      const res = await request(app)
        .post("/api/v1/complaints")
        .send({
          title: `Load benchmark test complaint ${i}`,
          description: "Measuring write latency and transactional consistency under load.",
          category: "STREETLIGHT",
          priority: "MEDIUM",
          lat: 11.0168 + i * 0.0001,
          lng: 76.9558 + i * 0.0001,
          address: "Gandhipuram Benchmark Zone",
        });
      const duration = performance.now() - start;

      expect(res.status).toBe(201);
      latencies.push(duration);
      if (i === 0) {
        payloadBytes = Buffer.byteLength(JSON.stringify(res.body), "utf8");
      }
    }

    const stats = calculatePercentiles(latencies, payloadBytes);
    benchmarkResults["POST /complaints (creation)"] = stats;

    expect(stats.p95).toBeLessThan(250);
  });

  afterAll(() => {
    const summaryPath = path.resolve(__dirname, "./benchmark_summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify(benchmarkResults, null, 2), "utf8");
  });
});
