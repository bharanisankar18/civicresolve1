import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { StatusTimeline } from "../features/tracker/StatusTimeline";
import { StatusEventDto } from "@civicresolve/shared";

describe("StatusTimeline Component", () => {
  const events: StatusEventDto[] = [
    {
      id: "evt-1",
      status: "REPORTED",
      remarks: "Complaint lodged by citizen with photo",
      createdAt: new Date("2024-05-01T10:00:00Z"),
    },
    {
      id: "evt-2",
      status: "IN_PROGRESS",
      remarks: "Maintenance team deployed to site",
      createdAt: new Date("2024-05-01T14:00:00Z"),
    },
  ];

  it("renders timeline with chronological events", () => {
    render(<StatusTimeline events={events} currentStatus="IN_PROGRESS" />);

    expect(screen.getByText("Official Grievance Timeline")).toBeInTheDocument();
    expect(screen.getByText("REPORTED")).toBeInTheDocument();
    expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    expect(screen.getByText("Maintenance team deployed to site")).toBeInTheDocument();
  });
});
