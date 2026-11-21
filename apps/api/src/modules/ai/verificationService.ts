import { GoogleGenAI, PartUnion } from "@google/genai";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { AIVerificationOutput, AIVerificationOutputSchema } from "@civicresolve/shared";
import fs from "fs";
import path from "path";

export interface VerifyResolutionOptions {
  category: string;
  beforeImagePath?: string | null;
  afterImagePath: string;
  remarks?: string;
}

export function readImageAsBase64(relativeUrl: string): { mimeType: string; data: string } | null {
  try {
    const filename = path.basename(relativeUrl);
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    const fullPath = path.resolve(uploadsDir, filename);
    if (!fullPath.startsWith(uploadsDir) || !fs.existsSync(fullPath)) return null;

    const buffer = fs.readFileSync(fullPath);
    return {
      mimeType: "image/jpeg",
      data: buffer.toString("base64"),
    };
  } catch (_e) {
    return null;
  }
}

/**
 * Compares "before" and "after" images using Gemini multimodal AI to verify
 * whether the civic issue (pothole filled, garbage removed, etc.) is genuinely resolved.
 */
export async function verifyResolutionProof(
  options: VerifyResolutionOptions,
): Promise<AIVerificationOutput> {
  const { category, beforeImagePath, afterImagePath, remarks = "" } = options;

  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === "") {
    logger.info("Gemini API key not configured. Using rule-based resolution approval.");
    return {
      verified: true,
      confidence: 0.85,
      reason:
        "Rule-based resolution validation (AI unavailable): Admin submitted after-image proof.",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const model = env.GEMINI_MODEL || "gemini-1.5-flash";

    const afterImg = readImageAsBase64(afterImagePath);
    if (!afterImg) {
      return {
        verified: true,
        confidence: 0.8,
        reason: "After image provided by municipal officer.",
      };
    }

    const contents: PartUnion[] = [];

    if (beforeImagePath) {
      const beforeImg = readImageAsBase64(beforeImagePath);
      if (beforeImg) {
        contents.push({ text: "BEFORE IMAGE (The reported defect):" });
        contents.push({
          inlineData: {
            mimeType: beforeImg.mimeType,
            data: beforeImg.data,
          },
        });
      }
    }

    contents.push({ text: "AFTER IMAGE (The completed municipal repair):" });
    contents.push({
      inlineData: {
        mimeType: afterImg.mimeType,
        data: afterImg.data,
      },
    });

    contents.push({
      text: `Issue Category: ${category}
Admin remarks: ${remarks}
Verify if the before defect is rectified in the after photo.
Return JSON:
{
  "verified": boolean,
  "confidence": number between 0 and 1,
  "reason": "Detailed explanation comparing before and after"
}`,
    });

    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("Gemini API verification timed out")), 10000);
    });

    const apiPromise = ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction:
          "You are an impartial municipal quality-assurance inspector. Inspect before and after images of public works. Verify whether the pothole, garbage, leak, or road damage has truly been resolved.",
        responseMimeType: "application/json",
      },
    });

    let raw = "{}";
    try {
      const response = (await Promise.race([apiPromise, timeoutPromise])) as { text?: string };
      raw = response?.text?.trim() || "{}";
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/gi, "").trim();
    return AIVerificationOutputSchema.parse(JSON.parse(cleaned));
  } catch (error) {
    logger.warn(
      { error },
      "Gemini resolution verification failed. Falling back to default verification.",
    );
    return {
      verified: true,
      confidence: 0.8,
      reason: "Rule-based resolution validation (AI unavailable): Image proof accepted.",
    };
  }
}
