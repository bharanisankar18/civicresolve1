import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SLACountdownCard } from "../features/tracker/SLACountdownCard";

describe("SLACountdownCard Component", () => {
  it("renders active SLA countdown on schedule", () => {
    const futureDate = new Date(Date.now() + 24 * 3600 * 1000); // +24 hours
    render(
      <SLACountdownCard
        slaDueAt={futureDate}
        slaHours={48}
        departmentName="Roads & Bridges Department"
      />,
    );

    expect(screen.getByText("Roads & Bridges Department")).toBeInTheDocument();
    expect(screen.getByText("On Schedule")).toBeInTheDocument();
    expect(screen.getByText(/remaining/)).toBeInTheDocument();
  });

  it("displays ESCALATED badge when SLA is breached", () => {
    const pastDate = new Date(Date.now() - 5 * 3600 * 1000); // 5h overdue
    render(<SLACountdownCard slaDueAt={pastDate} slaHours={24} isEscalated={true} />);

    expect(screen.getByText("ESCALATED")).toBeInTheDocument();
    expect(screen.getByText(/Breached by 5h/)).toBeInTheDocument();
  });
});
