import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { CivicHeatmap } from "../features/map/CivicHeatmap";
import { ComplaintPriority } from "@civicresolve/shared";

// Mock react-leaflet components since Leaflet expects a browser DOM canvas/SVG
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

describe("CivicHeatmap Component - Geospatial & Table Modes", () => {
  const samplePoints = [
    {
      id: "pt-1",
      trackingCode: "CR-2026-000001",
      title: "Dangerous Pothole at Peelamedu",
      category: "POTHOLE",
      priority: "HIGH" as ComplaintPriority,
      status: "REPORTED",
      impactScore: 85,
      lat: 11.0267,
      lng: 77.0028,
      address: "Peelamedu, Coimbatore",
      createdAt: new Date().toISOString(),
    },
    {
      id: "pt-2",
      trackingCode: "CR-2026-000002",
      title: "Garbage Overflow at Gandhipuram",
      category: "GARBAGE",
      priority: "CRITICAL" as ComplaintPriority,
      status: "IN_PROGRESS",
      impactScore: 92,
      lat: 11.0168,
      lng: 76.9558,
      address: "Gandhipuram, Coimbatore",
      createdAt: new Date().toISOString(),
    },
  ];

  it("renders map view with active complaints badge", () => {
    render(
      <BrowserRouter>
        <CivicHeatmap points={samplePoints} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Civic Issue Spatial Heatmap")).toBeInTheDocument();
    expect(screen.getByText("2 Active Issues")).toBeInTheDocument();
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getAllByTestId("circle-marker")).toHaveLength(2);
  });

  it("toggles to Accessible Table Alternative and renders complete tabular data", () => {
    render(
      <BrowserRouter>
        <CivicHeatmap points={samplePoints} />
      </BrowserRouter>,
    );

    const toggleBtn = screen.getByRole("button", {
      name: /Switch to accessible table alternative/i,
    });
    fireEvent.click(toggleBtn);

    expect(screen.getByLabelText("Tabular list of civic grievances")).toBeInTheDocument();
    expect(screen.getByText("Dangerous Pothole at Peelamedu")).toBeInTheDocument();
    expect(screen.getByText("Garbage Overflow at Gandhipuram")).toBeInTheDocument();
    expect(screen.getByText("CR-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("CR-2026-000002")).toBeInTheDocument();

    // Toggle back to interactive map
    const mapToggleBtn = screen.getByRole("button", {
      name: /Switch to interactive map/i,
    });
    fireEvent.click(mapToggleBtn);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
  });

  it("displays capping badge when dataset contains over 300 complaints", () => {
    // Generate 350 mock complaints
    const largeDataset = Array.from({ length: 350 }, (_, i) => ({
      id: `pt-${i}`,
      trackingCode: `CR-2026-${String(i).padStart(6, "0")}`,
      title: `Issue ${i}`,
      category: "POTHOLE",
      priority: "MEDIUM" as ComplaintPriority,
      status: "REPORTED",
      impactScore: (i % 100) + 1,
      lat: 11.01 + (i % 10) * 0.001,
      lng: 76.95 + (i % 10) * 0.001,
      address: "Coimbatore",
      createdAt: new Date().toISOString(),
    }));

    render(
      <BrowserRouter>
        <CivicHeatmap points={largeDataset} />
      </BrowserRouter>,
    );

    expect(screen.getByText("300 of 350 Highest-Impact Shown")).toBeInTheDocument();
    expect(screen.getAllByTestId("circle-marker")).toHaveLength(300);
  });
});
