import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "../Input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders a label when provided", () => {
    render(<Input label="Email" inputId="email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders helper text", () => {
    render(<Input helperText="Enter your email" inputId="email" />);
    expect(screen.getByText("Enter your email")).toBeInTheDocument();
  });

  it("renders error message and sets aria-invalid", () => {
    render(<Input error="Required field" inputId="email" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows error style when error is provided even if variant is default", () => {
    render(<Input error="Oops" inputId="test" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-[#ef4444]");
  });

  it("shows default border when no error", () => {
    render(<Input inputId="test" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-[#e5e7eb]");
  });

  it("hides helper text when error is shown", () => {
    render(<Input error="Bad" helperText="Helpful" inputId="test" />);
    expect(screen.getByText("Bad")).toBeInTheDocument();
    expect(screen.queryByText("Helpful")).not.toBeInTheDocument();
  });

  it("applies disabled styles", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("passes placeholder through", () => {
    render(<Input placeholder="Type here..." />);
    expect(screen.getByPlaceholderText("Type here...")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<Input className="w-64" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("w-64");
  });
});
