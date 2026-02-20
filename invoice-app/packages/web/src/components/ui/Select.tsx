import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { ChevronDown } from "lucide-react";

export type SelectVariant = "default" | "error";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: SelectVariant;
  label?: string;
  error?: string;
  helperText?: string;
  selectId?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant = "default",
      label,
      error,
      helperText,
      selectId,
      options,
      placeholder,
      className,
      ...props
    },
    ref,
  ) => {
    const id = selectId ?? props.id;
    const resolvedVariant = error ? "error" : variant;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[#1a1a2e]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              "w-full appearance-none rounded border bg-white px-3 py-2 pr-10 text-sm text-[#1a1a2e] transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              resolvedVariant === "error"
                ? "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/20"
                : "border-[#e5e7eb] focus:border-[#0078c8] focus:ring-[#0078c8]/20",
              "disabled:bg-gray-50 disabled:text-[#6b7280] disabled:cursor-not-allowed",
              className,
            )}
            aria-invalid={resolvedVariant === "error" ? true : undefined}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
        </div>
        {error && (
          <p id={`${id}-error`} className="text-sm text-[#ef4444]" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${id}-helper`} className="text-sm text-[#6b7280]">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
