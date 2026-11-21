import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { TriageQueue } from "../features/admin/TriageQueue";
import { ComplaintDto } from "@civicresolve/shared";

describe("TriageQueue Component", () => {
  const mockComplaints: ComplaintDto[] = [
    {
      id: "c-1",
      trackingCode: "CR-2026-0001",
      title: "Massive Pothole on Gandhipuram Crosscut Rd",
      description: "Dangerous pothole causing traffic slowdown",
      language: "en",
      category: "POTHOLE",
      status: "REPORTED",
      priority: "HIGH",
      impactScore: 82,
      scoreBreakdown: {
        urgency: 25,
        safetyHazard: 25,
        poiProximity: 20,
        nearestPoiName: "Gandhipuram Bus Stand",
        distanceToPoiMeters: 200,
        supportBoost: 6,
        ageBoost: 6,
        total: 82,
      },
      aiSource: "GEMINI",
      lat: 11.0168,
      lng: 76.9558,
      address: "Gandhipuram, Coimbatore",
      supportCount: 3,
      slaDueAt: new Date(Date.now() + 86400000).toISOString(),
      isEscalated: false,
      departmentId: "dept-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "c-2",
      trackingCode: "CR-2026-0002",
      title: "Overflowing Garbage Bin near CMCH",
      description: "Garbage spilling onto the main walkway",
      language: "en",
      category: "GARBAGE",
      status: "ESCALATED",
      priority: "CRITICAL",
      impactScore: 94,
      scoreBreakdown: {
        urgency: 30,
        safetyHazard: 25,
        poiProximity: 30,
        nearestPoiName: "Coimbatore Medical College Hospital",
        distanceToPoiMeters: 50,
        supportBoost: 4,
        ageBoost: 5,
        total: 94,
      },
      aiSource: "GEMINI",
      lat: 11.002,
      lng: 76.965,
      address: "Near CMCH Hospital",
      supportCount: 2,
      slaDueAt: new Date(Date.now() - 3600000).toISOString(),
      isEscalated: true,
      departmentId: "dept-2",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("renders complaints table with tracking codes and impact scores", () => {
    const onSelect = vi.fn();
    const onResolve = vi.fn();

    render(
      <TriageQueue
        complaints={mockComplaints}
        onSelectComplaint={onSelect}
        onOpenResolve={onResolve}
      />,
    );

    expect(screen.getByText("CR-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("CR-2026-0002")).toBeInTheDocument();
    expect(screen.getByText("Massive Pothole on Gandhipuram Crosscut Rd")).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText("94")).toBeInTheDocument();
  });

  it("filters complaints by search query", () => {
    const onSelect = vi.fn();
    const onResolve = vi.fn();

    render(
      <TriageQueue
        complaints={mockComplaints}
        onSelectComplaint={onSelect}
        onOpenResolve={onResolve}
      />,
    );

    const searchInput = screen.getByLabelText("Search grievances");
    fireEvent.change(searchInput, { target: { value: "Garbage" } });

    expect(screen.queryByText("CR-2026-0001")).not.toBeInTheDocument();
    expect(screen.getByText("CR-2026-0002")).toBeInTheDocument();
  });

  it("invokes callback when clicking View Details or Resolve", () => {
    const onSelect = vi.fn();
    const onResolve = vi.fn();

    render(
      <TriageQueue
        complaints={mockComplaints}
        onSelectComplaint={onSelect}
        onOpenResolve={onResolve}
      />,
    );

    const viewButtons = screen.getAllByLabelText(/View details for/);
    fireEvent.click(viewButtons[0]);
    expect(onSelect).toHaveBeenCalled();

    const resolveButtons = screen.getAllByLabelText(/Resolve CR-/);
    fireEvent.click(resolveButtons[0]);
    expect(onResolve).toHaveBeenCalled();
  });
});
