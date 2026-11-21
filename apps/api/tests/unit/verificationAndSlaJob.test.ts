import { describe, it, expect } from "vitest";
import { verifyResolutionProof } from "../../src/modules/ai/verificationService";
import { startSlaEscalationJob } from "../../src/jobs/slaEscalationCron";

describe("Resolution Verification & Background SLA Job", () => {
  it("approves resolution with rule-based fallback when Gemini API key is absent", async () => {
    const result = await verifyResolutionProof({
      category: "POTHOLE",
      beforeImagePath: "/uploads/sample-before.jpg",
      afterImagePath: "/uploads/sample-after.jpg",
      remarks: "Pothole patch work completed",
    });

    expect(result.verified).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.reason).toContain("Rule-based resolution validation");
  });

  it("initializes SLA escalation cron schedule without error", () => {
    const cronJob = startSlaEscalationJob();
    expect(cronJob).toBeDefined();
    cronJob.stop();
  });
});
