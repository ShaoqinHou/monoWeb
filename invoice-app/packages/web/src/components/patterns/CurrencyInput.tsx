import { useState, useCallback, useId } from "react";
import { cn } from "../../lib/cn";
import { formatCurrency, parseCurrency } from "@shared/calc/currency";

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  placeholder?: string;
  error?: string;
  label?: string;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  currency = "NZD",
  placeholder,
  error,
  label,
  className,
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [rawValue, setRawValue] = useState("");
  const generatedId = useId();
  const inputId = `currency-input-${generatedId}`;

  const displayValue = focused ? rawValue : formatCurrency(value, currency);

  const handleFocus = useCallback(() => {
    setFocused(true);
    // Show raw number for editing (strip formatting)
    setRawValue(value === 0 ? "" : String(value));
  }, [value]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    const parsed = parseCurrency(rawValue);
    onChange(parsed);
  }, [rawValue, onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRawValue(e.target.value);
    },
    [],
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#1a1a2e]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        role="textbox"
        type="text"
        inputMode="decimal"
        className={cn(
          "w-full rounded border px-3 py-2 text-sm text-[#1a1a2e] placeholder:text-[#6b7280] transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          error
            ? "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/20"
            : "border-[#e5e7eb] focus:border-[#0078c8] focus:ring-[#0078c8]/20",
          className,
        )}
        value={displayValue}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-[#ef4444]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
