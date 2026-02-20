import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Paid</Badge>);
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("applies default variant styles", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.className).toContain("bg-gray-100");
    expect(badge.className).toContain("text-gray-700");
  });

  it("applies success variant (Paid)", () => {
    render(<Badge variant="success">Paid</Badge>);
    const badge = screen.getByText("Paid");
    expect(badge.className).toContain("text-[#14b8a6]");
  });

  it("applies warning variant (Draft)", () => {
    render(<Badge variant="warning">Draft</Badge>);
    const badge = screen.getByText("Draft");
    expect(badge.className).toContain("text-[#f59e0b]");
  });

  it("applies error variant (Overdue)", () => {
    render(<Badge variant="error">Overdue</Badge>);
    const badge = screen.getByText("Overdue");
    expect(badge.className).toContain("text-[#ef4444]");
  });

  it("applies info variant (Submitted)", () => {
    render(<Badge variant="info">Submitted</Badge>);
    const badge = screen.getByText("Submitted");
    expect(badge.className).toContain("text-[#0078c8]");
  });

  it("has rounded-full pill shape", () => {
    render(<Badge>Pill</Badge>);
    const badge = screen.getByText("Pill");
    expect(badge.className).toContain("rounded-full");
  });

  it("merges custom className", () => {
    render(<Badge className="ml-2">Extra</Badge>);
    const badge = screen.getByText("Extra");
    expect(badge.className).toContain("ml-2");
  });
});
