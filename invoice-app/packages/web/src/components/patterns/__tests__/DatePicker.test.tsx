import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DatePicker } from "../DatePicker";

describe("DatePicker", () => {
  it("renders with a label", () => {
    render(
      <DatePicker value="2024-01-15" onChange={vi.fn()} label="Due Date" />,
    );
    expect(screen.getByLabelText("Due Date")).toBeInTheDocument();
  });

  it("renders the date input with the provided value", () => {
    render(<DatePicker value="2024-03-20" onChange={vi.fn()} />);
    const input = screen.getByDisplayValue("2024-03-20");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "date");
  });

  it("calls onChange when the date changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <DatePicker value="" onChange={onChange} />,
    );

    const input = container.querySelector("input")!;
    fireEvent.change(input, { target: { value: "2024-06-15" } });

    expect(onChange).toHaveBeenCalledWith("2024-06-15");
  });

  it("shows error message", () => {
    render(
      <DatePicker
        value=""
        onChange={vi.fn()}
        error="Date is required"
      />,
    );
    expect(screen.getByText("Date is required")).toBeInTheDocument();
  });

  it("applies min and max attributes", () => {
    render(
      <DatePicker
        value="2024-06-15"
        onChange={vi.fn()}
        min="2024-01-01"
        max="2024-12-31"
      />,
    );
    const input = screen.getByDisplayValue("2024-06-15");
    expect(input).toHaveAttribute("min", "2024-01-01");
    expect(input).toHaveAttribute("max", "2024-12-31");
  });

  it("renders without label when not provided", () => {
    render(<DatePicker value="2024-01-01" onChange={vi.fn()} />);
    const labels = document.querySelectorAll("label");
    expect(labels.length).toBe(0);
  });

  it("shows error style on the input", () => {
    const { container } = render(
      <DatePicker
        value=""
        onChange={vi.fn()}
        error="Invalid date"
      />,
    );
    const input = container.querySelector("input");
    expect(input?.getAttribute("aria-invalid")).toBe("true");
  });
});
