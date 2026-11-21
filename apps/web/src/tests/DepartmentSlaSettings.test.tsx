import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { DepartmentSlaSettings } from "../features/admin/DepartmentSlaSettings";
import { api } from "../lib/api";
import { DepartmentDto } from "@civicresolve/shared";

vi.mock("../lib/api", () => ({
  api: {
    listDepartments: vi.fn(),
    updateDepartmentSla: vi.fn(),
  },
}));

describe("DepartmentSlaSettings Component", () => {
  const mockDepartments: DepartmentDto[] = [
    {
      id: "dept-roads",
      name: "Roads & Bridges Department",
      code: "ROADS",
      slaHours: 48,
    },
    {
      id: "dept-sanitation",
      name: "Solid Waste & Sanitation Department",
      code: "SANITATION",
      slaHours: 24,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listDepartments).mockResolvedValue(mockDepartments);
    vi.mocked(api.updateDepartmentSla).mockResolvedValue({
      ...mockDepartments[0]!,
      slaHours: 36,
    });
  });

  it("loads and displays list of departments with their SLA hours", async () => {
    render(<DepartmentSlaSettings />);

    expect(screen.getByText("Municipal Department SLA Configuration")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Roads & Bridges Department")).toBeInTheDocument();
      expect(screen.getByText("Solid Waste & Sanitation Department")).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    expect(inputs[0]?.value).toBe("48");
    expect(inputs[1]?.value).toBe("24");
  });

  it("allows updating SLA hours and displays success notification", async () => {
    render(<DepartmentSlaSettings />);

    await waitFor(() => {
      expect(screen.getByText("Roads & Bridges Department")).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    fireEvent.change(inputs[0]!, { target: { value: "36" } });

    const updateBtns = screen.getAllByRole("button", { name: /Update SLA/i });
    fireEvent.click(updateBtns[0]!);

    await waitFor(() => {
      expect(api.updateDepartmentSla).toHaveBeenCalledWith("dept-roads", 36);
      expect(screen.getByText("SLA target hours updated successfully!")).toBeInTheDocument();
    });
  });
});
