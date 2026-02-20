import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Select, type SelectOption } from "../Select";

const options: SelectOption[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
];

describe("Select", () => {
  it("renders a select element", () => {
    render(<Select options={options} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders all options", () => {
    render(<Select options={options} />);
    const opts = screen.getAllByRole("option");
    expect(opts).toHaveLength(3);
    expect(opts[0]).toHaveTextContent("Draft");
    expect(opts[1]).toHaveTextContent("Sent");
    expect(opts[2]).toHaveTextContent("Paid");
  });

  it("renders placeholder option", () => {
    render(<Select options={options} placeholder="Select status..." />);
    const opts = screen.getAllByRole("option");
    expect(opts).toHaveLength(4);
    expect(opts[0]).toHaveTextContent("Select status...");
  });

  it("renders label", () => {
    render(<Select options={options} label="Status" selectId="status" />);
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("shows error message", () => {
    render(<Select options={options} error="Required" selectId="status" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows error border when error prop set", () => {
    render(<Select options={options} error="Oops" selectId="s" />);
    const select = screen.getByRole("combobox");
    expect(select.className).toContain("border-[#ef4444]");
  });

  it("shows helper text", () => {
    render(<Select options={options} helperText="Pick one" selectId="s" />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("hides helper when error present", () => {
    render(<Select options={options} error="Bad" helperText="Help" selectId="s" />);
    expect(screen.getByText("Bad")).toBeInTheDocument();
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("fires onChange", () => {
    const onChange = vi.fn();
    render(<Select options={options} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "paid" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("supports disabled state", () => {
    render(<Select options={options} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
