import { useCallback, useId } from "react";
import { cn } from "../../lib/cn";

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  min?: string;
  max?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  error,
  min,
  max,
  className,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = `date-picker-${generatedId}`;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
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
        type="date"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        className={cn(
          "w-full rounded border px-3 py-2 text-sm text-[#1a1a2e] transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          error
            ? "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/20"
            : "border-[#e5e7eb] focus:border-[#0078c8] focus:ring-[#0078c8]/20",
          className,
        )}
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
