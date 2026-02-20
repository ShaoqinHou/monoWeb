import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CurrencyInput } from "../CurrencyInput";

describe("CurrencyInput", () => {
  it("renders with a label", () => {
    render(
      <CurrencyInput value={0} onChange={vi.fn()} label="Amount" />,
    );
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
  });

  it("displays formatted currency value when not focused", () => {
    render(<CurrencyInput value={1234.56} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("$1,234.56");
  });

  it("shows raw number on focus", async () => {
    const user = userEvent.setup();
    render(<CurrencyInput value={1234.56} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;

    await user.click(input);
    expect(input.value).toBe("1234.56");
  });

  it("formats number on blur", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencyInput value={0} onChange={onChange} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;

    await user.click(input);
    await user.clear(input);
    await user.type(input, "5678.90");
    await user.tab(); // blur

    expect(onChange).toHaveBeenCalledWith(5678.9);
  });

  it("displays formatted value after blur", async () => {
    const user = userEvent.setup();
    let value = 0;
    const onChange = vi.fn((v: number) => {
      value = v;
    });

    const { rerender } = render(
      <CurrencyInput value={value} onChange={onChange} />,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;

    await user.click(input);
    await user.clear(input);
    await user.type(input, "999.99");
    await user.tab();

    // Simulate parent re-rendering with new value
    rerender(<CurrencyInput value={999.99} onChange={onChange} />);
    expect(input.value).toBe("$999.99");
  });

  it("handles empty input as zero", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencyInput value={100} onChange={onChange} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;

    await user.click(input);
    await user.clear(input);
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("handles invalid input as zero", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencyInput value={100} onChange={onChange} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;

    await user.click(input);
    await user.clear(input);
    await user.type(input, "abc");
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("shows error state", () => {
    render(
      <CurrencyInput value={0} onChange={vi.fn()} error="Required field" />,
    );
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("shows placeholder when value is 0 and placeholder is provided", () => {
    render(
      <CurrencyInput
        value={0}
        onChange={vi.fn()}
        placeholder="Enter amount"
      />,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.placeholder).toBe("Enter amount");
  });

  it("uses different currency symbol", () => {
    render(
      <CurrencyInput value={1000} onChange={vi.fn()} currency="GBP" />,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    // GBP uses pound symbol
    expect(input.value).toContain("\u00A3");
  });

  it("handles negative values", () => {
    render(<CurrencyInput value={-500} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("-$500.00");
  });
});
