import { describe, it, expect } from "vitest";
import { verifyResolutionProof, readImageAsBase64 } from "../../src/modules/ai/verificationService";

describe("Verification Service Unit Tests", () => {
  it("returns rule-based resolution approval when GEMINI_API_KEY is not set or file does not exist", async () => {
    const res = await verifyResolutionProof({
      category: "POTHOLE",
      beforeImagePath: "/uploads/non-existent-before.jpg",
      afterImagePath: "/uploads/non-existent-after.jpg",
      remarks: "Filled properly with tar",
    });

    expect(res.verified).toBe(true);
    expect(res.confidence).toBeGreaterThan(0.5);
    expect(res.reason).toBeDefined();
  });

  it("safely blocks path traversal attempts outside uploads directory", async () => {
    // 1. Direct boundary check returns null for relative traversal
    const imageResult = readImageAsBase64("../../../../../windows/system32/cmd.exe");
    expect(imageResult).toBeNull();

    // 2. High-level service handles traversal attempt gracefully without throwing
    const res = await verifyResolutionProof({
      category: "POTHOLE",
      beforeImagePath: "../../../../../windows/system32/cmd.exe",
      afterImagePath: "../../../../../windows/system32/cmd.exe",
      remarks: "Attempted path traversal",
    });

    expect(res.verified).toBe(true);
    expect(res.reason).toBeDefined();
  });
});
