import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "../StatusBadge";

describe("StatusBadge", () => {
  it("renders the status text capitalized", () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("maps draft to default variant (gray)", () => {
    const { container } = render(<StatusBadge status="draft" />);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-gray-100");
    expect(badge.className).toContain("text-gray-700");
  });

  it("maps submitted to info variant (blue)", () => {
    const { container } = render(<StatusBadge status="submitted" />);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[#0078c8]/10");
    expect(badge.className).toContain("text-[#0078c8]");
  });

  it("maps approved to warning variant (amber)", () => {
    const { container } = render(<StatusBadge status="approved" />);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[#f59e0b]/10");
    expect(badge.className).toContain("text-[#f59e0b]");
  });

  it("maps paid to success variant (green)", () => {
    const { container } = render(<StatusBadge status="paid" />);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[#14b8a6]/10");
    expect(badge.className).toContain("text-[#14b8a6]");
  });

  it("maps overdue to error variant (red)", () => {
    const { container } = render(<StatusBadge status="overdue" />);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[#ef4444]/10");
    expect(badge.className).toContain("text-[#ef4444]");
  });

  it("maps voided to default variant with line-through", () => {
    const { container } = render(<StatusBadge status="voided" />);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-gray-100");
    expect(badge.className).toContain("text-gray-700");
    expect(badge.className).toContain("line-through");
  });

  it("falls back to default variant for unknown status", () => {
    const { container } = render(<StatusBadge status="unknown" />);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-gray-100");
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("applies additional className", () => {
    const { container } = render(
      <StatusBadge status="draft" className="my-extra-class" />,
    );
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("my-extra-class");
  });
});
