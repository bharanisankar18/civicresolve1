import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import * as useAuthModule from "../hooks/useAuth";
import "../i18n";

describe("Navbar Component & Language Switcher", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders brand, navigation links, and unauthenticated sign-in CTA", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      isAdmin: false,
      isCitizen: false,
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>,
    );

    expect(screen.getByText("CivicResolve")).toBeInTheDocument();
    expect(screen.getByText("Report Issue")).toBeInTheDocument();
    expect(screen.getByText("Track Issue")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.queryByText("Admin Portal")).not.toBeInTheDocument();
  });

  it("renders Admin Portal and user greeting when logged in as admin", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: {
        id: "admin-1",
        email: "admin@civicresolve.gov.in",
        fullName: "Municipal Officer",
        role: "ADMIN",
        createdAt: new Date().toISOString(),
      },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      isAdmin: true,
      isCitizen: false,
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>,
    );

    expect(screen.getByText("Admin Portal")).toBeInTheDocument();
    expect(screen.getByText("(Admin)")).toBeInTheDocument();
  });

  it("switches language selection between English, Tamil, and Hindi", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      isAdmin: false,
      isCitizen: false,
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>,
    );

    const select = screen.getByLabelText("Select Language") as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    // Select Tamil
    fireEvent.change(select, { target: { value: "ta" } });
    expect(select.value).toBe("ta");

    // Select Hindi
    fireEvent.change(select, { target: { value: "hi" } });
    expect(select.value).toBe("hi");

    // Switch back to English
    fireEvent.change(select, { target: { value: "en" } });
    expect(select.value).toBe("en");
  });

  it("toggles high-contrast accessibility mode and dark mode", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      isAdmin: false,
      isCitizen: false,
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>,
    );

    // Toggle high-contrast
    const contrastBtn = screen.getByLabelText("Enable high contrast");
    fireEvent.click(contrastBtn);
    expect(localStorage.getItem("civic_high_contrast")).toBe("true");

    // Toggle dark theme
    const themeBtn = screen.getByLabelText("Switch to dark mode");
    fireEvent.click(themeBtn);
    expect(localStorage.getItem("civic_theme")).toBe("dark");
  });
});
