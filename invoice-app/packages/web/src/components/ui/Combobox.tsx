import {
  useState,
  useRef,
  useEffect,
  useId,
  type KeyboardEvent,
} from "react";
import { cn } from "../../lib/cn";
import { ChevronDown, Plus } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder,
  label,
  error,
  disabled,
  className,
  "data-testid": dataTestId,
}: ComboboxProps) {
  const id = useId();
  const listboxId = `${id}-listbox`;

  const selectedOption = options.find((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selectedOption?.label ?? "");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync query with external value changes
  useEffect(() => {
    if (!open) {
      setQuery(selectedOption?.label ?? "");
    }
  }, [value, open, selectedOption]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selectedOption?.label ?? "");
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, selectedOption]);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
    setHighlightedIndex(-1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setHighlightedIndex(-1);
    if (!open) setOpen(true);
  }

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          selectOption(filtered[highlightedIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setQuery(selectedOption?.label ?? "");
        setHighlightedIndex(-1);
        break;
    }
  }

  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", className)} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#1a1a2e]">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={hasError ? `${id}-error` : undefined}
          type="text"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onChange={handleInputChange}
          onClick={openDropdown}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          data-testid={dataTestId}
          className={cn(
            "w-full rounded border px-3 py-2 pr-10 text-sm text-[#1a1a2e] placeholder:text-[#6b7280] transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            hasError
              ? "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/20"
              : "border-[#e5e7eb] focus:border-[#0078c8] focus:ring-[#0078c8]/20",
            "disabled:bg-gray-50 disabled:text-[#6b7280] disabled:cursor-not-allowed",
          )}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />

        {open && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-50 mt-1 w-full rounded border border-[#e5e7eb] bg-white py-1 shadow-md"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[#6b7280]">
                No results found
              </li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm text-[#1a1a2e]",
                    index === highlightedIndex
                      ? "bg-[#f0f7ff]"
                      : "hover:bg-[#f9fafb]",
                    option.value === value && "font-medium",
                  )}
                >
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="ml-2 text-xs text-[#6b7280]">
                      {option.description}
                    </span>
                  )}
                </li>
              ))
            )}

            {onCreateNew && (
              <>
                {filtered.length > 0 && (
                  <li role="separator" className="my-1 border-t border-[#e5e7eb]" />
                )}
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onCreateNew();
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#0078c8] hover:bg-[#f0f7ff]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create new
                  </button>
                </li>
              </>
            )}
          </ul>
        )}
      </div>

      {hasError && (
        <p id={`${id}-error`} className="text-sm text-[#ef4444]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
