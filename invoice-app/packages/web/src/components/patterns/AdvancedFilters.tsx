import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type {
  FilterFieldConfig,
  FilterValues,
  AdvancedFiltersState,
} from "../../lib/useAdvancedFilters";

export interface AdvancedFiltersProps {
  fields: FilterFieldConfig[];
  filtersState: AdvancedFiltersState;
}

export function AdvancedFilters({ fields, filtersState }: AdvancedFiltersProps) {
  const { filters, activeCount, clearFilters, applyFilters } = filtersState;
  const [collapsed, setCollapsed] = useState(false);
  const [pending, setPending] = useState<FilterValues>({ ...filters });

  const handlePendingChange = (key: string, value: string | string[] | undefined) => {
    setPending((prev) => {
      const next = { ...prev };
      if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const handleApply = () => {
    applyFilters(pending);
  };

  const handleClear = () => {
    setPending({});
    clearFilters();
  };

  return (
    <div className="border border-[#e5e7eb] rounded-lg bg-white" data-testid="advanced-filters">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[#1a1a2e] hover:bg-gray-50"
        data-testid="filter-toggle"
      >
        <span className="flex items-center gap-2">
          Filters
          {activeCount > 0 && (
            <Badge variant="info" data-testid="active-filter-count">
              {activeCount}
            </Badge>
          )}
        </span>
        {collapsed ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>

      {!collapsed && (
        <div className="border-t border-[#e5e7eb] px-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="filter-fields">
            {fields.map((field) => (
              <FilterField
                key={field.key}
                field={field}
                value={pending[field.key]}
                onChange={(value) => handlePendingChange(field.key, value)}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={handleApply} data-testid="apply-filters">
              Apply Filters
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              data-testid="clear-filters"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterFieldProps {
  field: FilterFieldConfig;
  value: string | string[] | undefined;
  onChange: (value: string | string[] | undefined) => void;
}

function FilterField({ field, value, onChange }: FilterFieldProps) {
  switch (field.type) {
    case "text":
      return (
        <Input
          label={field.label}
          placeholder={`Search ${field.label.toLowerCase()}...`}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          data-testid={`filter-${field.key}`}
        />
      );

    case "dateRange":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1a1a2e]">{field.label}</label>
          <div className="flex gap-2">
            <input
              type="date"
              className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm"
              value={((value as string) ?? "").split("..")[0] ?? ""}
              onChange={(e) => {
                const to = ((value as string) ?? "").split("..")[1] ?? "";
                const from = e.target.value;
                onChange(from || to ? `${from}..${to}` : undefined);
              }}
              data-testid={`filter-${field.key}-from`}
            />
            <input
              type="date"
              className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm"
              value={((value as string) ?? "").split("..")[1] ?? ""}
              onChange={(e) => {
                const from = ((value as string) ?? "").split("..")[0] ?? "";
                const to = e.target.value;
                onChange(from || to ? `${from}..${to}` : undefined);
              }}
              data-testid={`filter-${field.key}-to`}
            />
          </div>
        </div>
      );

    case "amountRange":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1a1a2e]">{field.label}</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm"
              value={((value as string) ?? "").split("..")[0] ?? ""}
              onChange={(e) => {
                const max = ((value as string) ?? "").split("..")[1] ?? "";
                const min = e.target.value;
                onChange(min || max ? `${min}..${max}` : undefined);
              }}
              data-testid={`filter-${field.key}-min`}
            />
            <input
              type="number"
              placeholder="Max"
              className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm"
              value={((value as string) ?? "").split("..")[1] ?? ""}
              onChange={(e) => {
                const min = ((value as string) ?? "").split("..")[0] ?? "";
                const max = e.target.value;
                onChange(min || max ? `${min}..${max}` : undefined);
              }}
              data-testid={`filter-${field.key}-max`}
            />
          </div>
        </div>
      );

    case "status":
      return (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#1a1a2e]">{field.label}</label>
          <div className="flex flex-wrap gap-2" data-testid={`filter-${field.key}`}>
            {field.options?.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const current = Array.isArray(value) ? value : [];
                    const next = selected
                      ? current.filter((v) => v !== opt.value)
                      : [...current, opt.value];
                    onChange(next.length > 0 ? next : undefined);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selected
                      ? "border-[#0078c8] bg-[#0078c8]/10 text-[#0078c8]"
                      : "border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#0078c8]"
                  }`}
                  data-testid={`filter-${field.key}-${opt.value}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      );

    case "contact":
      return (
        <Input
          label={field.label}
          placeholder={`Search ${field.label.toLowerCase()}...`}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          data-testid={`filter-${field.key}`}
        />
      );

    default:
      return null;
  }
}
