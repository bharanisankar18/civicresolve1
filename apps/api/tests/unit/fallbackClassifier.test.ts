import { describe, it, expect } from "vitest";
import { classifyWithRules } from "../../src/modules/ai/fallbackClassifier";

describe("Resilient Rule-Based Keyword Classifier", () => {
  it("classifies pothole grievances in English accurately", () => {
    const result = classifyWithRules("There is a dangerous deep pothole near the bus stand.");
    expect(result.category).toBe("POTHOLE");
    expect(result.suggestedDepartmentCode).toBe("ROADS");
    expect(result.urgencyScore).toBeGreaterThanOrEqual(22);
  });

  it("classifies garbage grievances in Tamil accurately", () => {
    const result = classifyWithRules("தெருவில் குப்பை அதிகமாக தேங்கி கிடக்கிறது, துர்நாற்றம் வீசுகிறது.");
    expect(result.category).toBe("GARBAGE");
    expect(result.suggestedDepartmentCode).toBe("SANITATION");
  });

  it("classifies water pipeline leak in Hindi accurately", () => {
    const result = classifyWithRules(
      "सड़क पर मुख्य पानी की पाइपलाइन टूट गई है और पीने का पानी बह रहा है।",
    );
    expect(result.category).toBe("WATER_LEAKAGE");
    expect(result.suggestedDepartmentCode).toBe("WATER_DRAINAGE");
  });

  it("classifies unlit streetlight accurately", () => {
    const result = classifyWithRules(
      "Streetlight not functioning, area is completely dark at night.",
    );
    expect(result.category).toBe("STREETLIGHT");
    expect(result.suggestedDepartmentCode).toBe("ELECTRICAL");
  });

  it("classifies open sewage drainage issue accurately", () => {
    const result = classifyWithRules("Open drainage gutter overflowing with sewage after rain.");
    expect(result.category).toBe("DRAINAGE");
    expect(result.suggestedDepartmentCode).toBe("WATER_DRAINAGE");
  });

  it("elevates priority to CRITICAL when accident and emergency keywords appear", () => {
    const result = classifyWithRules(
      "Severe danger! Big crater caused an accident and injury near hospital.",
    );
    expect(result.priority).toBe("CRITICAL");
    expect(result.urgencyScore).toBe(30);
    expect(result.safetyHazardScore).toBe(25);
  });

  it("handles empty or vague text without throwing", () => {
    const result = classifyWithRules("");
    expect(result.category).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.priority).toBeDefined();
  });
});
