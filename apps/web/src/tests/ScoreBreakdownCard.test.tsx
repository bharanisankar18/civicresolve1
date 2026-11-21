import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ScoreBreakdownCard } from "../features/tracker/ScoreBreakdownCard";

describe("ScoreBreakdownCard Component", () => {
  const breakdown = {
    urgency: 25,
    safetyHazard: 20,
    poiProximity: 25,
    nearestPoiName: "Coimbatore Medical College Hospital (CMCH)",
    distanceToPoiMeters: 150,
    supportBoost: 4,
    ageBoost: 2,
    total: 76,
  };

  it("renders total score with 0-100 scale", () => {
    render(
      <ScoreBreakdownCard
        score={76}
        breakdown={breakdown}
        aiReasoning="Critical road defect near hospital entrance"
        aiSource="GEMINI"
      />,
    );

    expect(screen.getByText("Explainable Impact Score")).toBeInTheDocument();
    expect(screen.getByText("76 / 100")).toBeInTheDocument();
    expect(screen.getByText(/Gemini Multimodal AI/)).toBeInTheDocument();
    expect(screen.getByText(/Critical road defect near hospital entrance/)).toBeInTheDocument();
  });

  it("displays POI proximity details and community support boost", () => {
    render(<ScoreBreakdownCard score={76} breakdown={breakdown} aiSource="RULE_BASED" />);

    expect(screen.getByText(/Coimbatore Medical College Hospital/)).toBeInTheDocument();
    expect(screen.getByText(/\+4 pts from citizen endorsements/)).toBeInTheDocument();
    expect(screen.getByText(/Rule-based \(AI unavailable\)/)).toBeInTheDocument();
  });
});
