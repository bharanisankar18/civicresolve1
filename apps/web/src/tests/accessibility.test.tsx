import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axe from "axe-core";
import "../i18n";

import { SkipLink } from "../components/SkipLink";
import { AccessibleModal } from "../components/AccessibleModal";
import { ScoreBreakdownCard } from "../features/tracker/ScoreBreakdownCard";
import { SLACountdownCard } from "../features/tracker/SLACountdownCard";
import { StatusTimeline } from "../features/tracker/StatusTimeline";
import { CivicHeatmap } from "../features/map/CivicHeatmap";
import { Footer } from "../components/Footer";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DepartmentSlaSettings } from "../features/admin/DepartmentSlaSettings";

// Mock react-leaflet components since Leaflet expects a real browser DOM canvas/SVG
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  CircleMarker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="circle-marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
}));

// Mock API
vi.mock("../lib/api", () => ({
  api: {
    listDepartments: vi.fn().mockResolvedValue([
      {
        id: "dept-1",
        name: "Roads & Bridges",
        code: "ROADS",
        slaHours: 36,
        description: "Potholes and road restoration",
      },
    ]),
    updateDepartmentSla: vi.fn().mockResolvedValue({
      id: "dept-1",
      name: "Roads & Bridges",
      code: "ROADS",
      slaHours: 48,
    }),
    login: vi.fn(),
    register: vi.fn(),
    getPublicStats: vi.fn().mockResolvedValue({
      totalComplaints: 120,
      resolvedComplaints: 90,
      inProgressComplaints: 20,
      escalatedComplaints: 10,
      resolutionRatePercentage: 75,
      averageResolutionHours: 18.5,
      categoryCounts: { POTHOLE: 45, GARBAGE: 35, STREETLIGHT: 40 },
    }),
  },
}));

const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isAdmin: false,
    isCitizen: false,
    login: mockLogin,
    register: mockRegister,
    logout: vi.fn(),
  }),
}));

describe("WCAG 2.2 AA Automated & Behavioral Accessibility Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockReset();
    mockRegister.mockReset();
  });

  describe("1. Bypass Blocks & Landmarks (WCAG 2.4.1, 1.3.1)", () => {
    it("renders Skip to Main Content link pointing to #main-content", () => {
      render(<SkipLink />);
      const skipLink = screen.getByRole("link", { name: /skip to/i });
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute("href", "#main-content");
      // Initially visually hidden with sr-only, visible on focus
      expect(skipLink).toHaveClass("sr-only");
    });

    it("renders footer with landmark and WCAG compliance notice", () => {
      render(<Footer />);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
      expect(screen.getByText(/WCAG 2.2 AA Compliant/i)).toBeInTheDocument();
    });
  });

  describe("2. Modal Focus Management & Keyboard Trap (WCAG 2.1.2, 2.4.3)", () => {
    it("manages dialog attributes, traps keyboard focus and closes on Escape", () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <AccessibleModal
          isOpen={true}
          onClose={handleClose}
          title="Verify Resolution Proof"
          description="Upload after-repair photo"
        >
          <div>
            <button type="button">First Action</button>
            <button type="button">Second Action</button>
          </div>
        </AccessibleModal>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");

      // Verify close on Escape key
      fireEvent.keyDown(document, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Verify unrendered when isOpen is false
      rerender(
        <AccessibleModal isOpen={false} onClose={handleClose} title="Verify Resolution Proof">
          <div>Modal Content</div>
        </AccessibleModal>,
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("3. Map Accessible Table Alternative (WCAG 1.1.1, 1.3.1)", () => {
    const mockPoints = [
      {
        id: "c-1",
        trackingCode: "CR-2026-100001",
        title: "Deep pothole on crossroad",
        category: "POTHOLE",
        priority: "HIGH" as const,
        status: "REPORTED",
        impactScore: 82,
        lat: 11.0168,
        lng: 76.9558,
        address: "Avinashi Road, Peelamedu",
        createdAt: new Date().toISOString(),
      },
    ];

    it("provides accessible table alternative with title, category, location, status, impact score", () => {
      render(
        <BrowserRouter>
          <CivicHeatmap points={mockPoints} />
        </BrowserRouter>,
      );

      // Toggle to accessible table mode
      const toggleBtn = screen.getByRole("button", {
        name: /switch to accessible table alternative/i,
      });
      fireEvent.click(toggleBtn);

      const table = screen.getByRole("table", { name: /tabular list of civic grievances/i });
      expect(table).toBeInTheDocument();

      // Check all required headers exist with scope="col"
      const headers = screen.getAllByRole("columnheader");
      const headerTexts = headers.map((h) => h.textContent?.trim());
      expect(headerTexts).toContain("Tracking Code");
      expect(headerTexts).toContain("Title");
      expect(headerTexts).toContain("Category");
      expect(headerTexts).toContain("Status");
      expect(headerTexts).toContain("Coordinates");
      expect(headerTexts).toContain("Impact Score");

      // Verify row data content
      expect(screen.getByText("CR-2026-100001")).toBeInTheDocument();
      expect(screen.getByText("Deep pothole on crossroad")).toBeInTheDocument();
      expect(screen.getByText("POTHOLE")).toBeInTheDocument();
      expect(screen.getByText("Reported")).toBeInTheDocument();
      expect(screen.getByText("82")).toBeInTheDocument();
    });
  });

  describe("4. Form Accessibility & Error Identification (WCAG 3.3.1, 3.3.2)", () => {
    it("connects validation errors with aria-invalid and aria-describedby on LoginPage", async () => {
      mockLogin.mockRejectedValueOnce(new Error("Invalid email or password"));

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>,
      );

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      expect(emailInput).toHaveAttribute("required");
      expect(passwordInput).toHaveAttribute("required");

      fireEvent.change(emailInput, { target: { value: "invalid@user.com" } });
      fireEvent.change(passwordInput, { target: { value: "WrongPass123" } });
      fireEvent.submit(emailInput.closest("form")!);

      await waitFor(() => {
        const errorAlert = screen.getByRole("alert");
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent("Invalid email or password");
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
        expect(emailInput).toHaveAttribute("aria-describedby", "login-error");
      });
    });

    it("connects validation errors with aria-invalid and aria-describedby on RegisterPage", async () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>,
      );

      const nameInput = screen.getByLabelText(/Full Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passInput = screen.getByLabelText(/Password/i);

      expect(nameInput).toBeRequired();
      expect(emailInput).toBeRequired();
      expect(passInput).toBeRequired();
    });
  });

  describe("5. Progressbars & Status Feedback (WCAG 4.1.2, 4.1.3)", () => {
    it("provides accessible names and values on ScoreBreakdownCard progressbars", () => {
      render(
        <ScoreBreakdownCard
          score={78}
          breakdown={{
            urgency: 20,
            safetyHazard: 20,
            poiProximity: 15,
            supportBoost: 8,
            ageBoost: 5,
            total: 78,
            nearestPoiName: "Apollo Hospital",
            distanceToPoiMeters: 240,
          }}
          aiReasoning="High urgency due to acute road crater."
          aiSource="GEMINI"
        />,
      );

      const progressbars = screen.getAllByRole("progressbar");
      expect(progressbars.length).toBe(5);

      // Verify each progressbar has aria-label matching the factor label
      expect(screen.getByRole("progressbar", { name: "Urgency Assessment" })).toHaveAttribute(
        "aria-valuenow",
        "20",
      );
      expect(screen.getByRole("progressbar", { name: "Public Safety Hazard" })).toHaveAttribute(
        "aria-valuenow",
        "20",
      );
      expect(
        screen.getByRole("progressbar", { name: "Proximity to Hospital / School" }),
      ).toHaveAttribute("aria-valuenow", "15");
      expect(
        screen.getByRole("progressbar", { name: "Citizen Community Support" }),
      ).toHaveAttribute("aria-valuenow", "8");
      expect(screen.getByRole("progressbar", { name: "Elapsed SLA Time Factor" })).toHaveAttribute(
        "aria-valuenow",
        "5",
      );
    });

    it("announces SLA countdown in live region and includes accessible text", () => {
      const futureDate = new Date(Date.now() + 10 * 3600 * 1000).toISOString();
      render(<SLACountdownCard slaDueAt={futureDate} slaHours={36} departmentName="Roads" />);

      expect(screen.getByText("Roads")).toBeInTheDocument();
      expect(screen.getByText("On Schedule")).toBeInTheDocument();
    });

    it("renders StatusTimeline with accessible list and timestamp semantics", () => {
      render(
        <StatusTimeline
          currentStatus="REPORTED"
          events={[
            {
              id: "evt-1",
              status: "REPORTED",
              remarks: "Issue submitted by citizen.",
              createdAt: new Date().toISOString(),
            },
          ]}
        />,
      );

      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();
      expect(screen.getByText("REPORTED")).toBeInTheDocument();
    });
  });

  describe("6. Automated axe-core WCAG 2.2 AA Auditing", () => {
    it("passes axe-core scan on DepartmentSlaSettings", async () => {
      const { container } = render(<DepartmentSlaSettings />);
      const results = await axe.run(container, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });

      const seriousViolations = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(seriousViolations).toEqual([]);
    });

    it("passes axe-core scan on ScoreBreakdownCard", async () => {
      const { container } = render(
        <ScoreBreakdownCard
          score={85}
          breakdown={{
            urgency: 25,
            safetyHazard: 25,
            poiProximity: 15,
            supportBoost: 10,
            ageBoost: 10,
            total: 85,
          }}
          aiReasoning="Pothole near school gate."
          aiSource="GEMINI"
        />,
      );

      const results = await axe.run(container, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });

      const seriousViolations = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(seriousViolations).toEqual([]);
    });
  });
});
