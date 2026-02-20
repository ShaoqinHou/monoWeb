// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Combobox } from "../Combobox";

const options = [
  { value: "contact-1", label: "Acme Corp", description: "acme@example.com" },
  { value: "contact-2", label: "Beta Ltd" },
  { value: "contact-3", label: "Gamma Inc", description: "gamma@example.com" },
];

describe("Combobox", () => {
  it("renders with label and placeholder", () => {
    render(
      <Combobox
        options={options}
        value=""
        onChange={vi.fn()}
        label="Contact"
        placeholder="Search contacts..."
      />,
    );
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search contacts...")).toBeInTheDocument();
  });

  it("opens dropdown on input click", async () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
    expect(screen.getByText("Gamma Inc")).toBeInTheDocument();
  });

  it("filters options on type", async () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: "beta" } });
    await waitFor(() => {
      expect(screen.getByText("Beta Ltd")).toBeInTheDocument();
      expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
      expect(screen.queryByText("Gamma Inc")).not.toBeInTheDocument();
    });
  });

  it("is case-insensitive when filtering", async () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: "ACME" } });
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });
  });

  it("selects option on click and calls onChange", async () => {
    const onChange = vi.fn();
    render(
      <Combobox options={options} value="" onChange={onChange} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    const option = await screen.findByText("Beta Ltd");
    fireEvent.click(option);
    expect(onChange).toHaveBeenCalledWith("contact-2");
  });

  it("shows selected item label in input", () => {
    render(
      <Combobox options={options} value="contact-2" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("combobox");
    expect(input).toHaveValue("Beta Ltd");
  });

  it("closes dropdown after selecting an option", async () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    const option = await screen.findByText("Acme Corp");
    fireEvent.click(option);
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("shows 'No results found' when filter matches nothing", async () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: "zzz" } });
    await waitFor(() => {
      expect(screen.getByText("No results found")).toBeInTheDocument();
    });
  });

  it("closes dropdown on Escape key", async () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("navigates options with arrow keys", async () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const items = screen.getAllByRole("option");
    expect(items[1]).toHaveAttribute("aria-selected", "true");
  });

  it("selects highlighted option on Enter key", async () => {
    const onChange = vi.fn();
    render(
      <Combobox options={options} value="" onChange={onChange} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    await screen.findByRole("listbox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("contact-1");
  });

  it("shows 'Create new' button when onCreateNew provided", async () => {
    const onCreateNew = vi.fn();
    render(
      <Combobox
        options={options}
        value=""
        onChange={vi.fn()}
        onCreateNew={onCreateNew}
      />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    const createBtn = await screen.findByText("Create new");
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(onCreateNew).toHaveBeenCalled();
  });

  it("does not show 'Create new' button when onCreateNew not provided", async () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    await screen.findByRole("listbox");
    expect(screen.queryByText("Create new")).not.toBeInTheDocument();
  });

  it("shows error message and aria-invalid", () => {
    render(
      <Combobox
        options={options}
        value=""
        onChange={vi.fn()}
        error="Contact is required"
      />,
    );
    expect(screen.getByText("Contact is required")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows error border styling", () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} error="Bad" />,
    );
    const input = screen.getByRole("combobox");
    expect(input.className).toContain("border-[#ef4444]");
  });

  it("is disabled when disabled prop set", () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} disabled />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("does not open dropdown when disabled", async () => {
    render(
      <Combobox options={options} value="" onChange={vi.fn()} disabled />,
    );
    const input = screen.getByRole("combobox");
    fireEvent.click(input);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
