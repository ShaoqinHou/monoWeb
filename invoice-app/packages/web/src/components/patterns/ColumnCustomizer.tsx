import { useState } from "react";
import { Button } from "../ui/Button";
import { ArrowUp, ArrowDown, Columns3 } from "lucide-react";
import type { ColumnCustomizationState } from "../../lib/useColumnCustomization";

export interface ColumnCustomizerProps {
  columnState: ColumnCustomizationState;
}

export function ColumnCustomizer({ columnState }: ColumnCustomizerProps) {
  const { allColumns, toggleColumn, reorderColumn, resetToDefault } = columnState;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" data-testid="column-customizer">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(!open)}
        data-testid="column-customizer-toggle"
      >
        <Columns3 className="h-3 w-3 mr-1" />
        Columns
      </Button>

      {open && (
        <div
          className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-[#e5e7eb] bg-white shadow-lg"
          data-testid="column-customizer-dropdown"
        >
          <div className="border-b border-[#e5e7eb] px-4 py-2">
            <span className="text-sm font-medium text-[#1a1a2e]">
              Toggle Columns
            </span>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {allColumns.map((col, idx) => (
              <li
                key={col.key}
                className="flex items-center gap-2 px-4 py-1.5"
              >
                <input
                  type="checkbox"
                  checked={col.visible}
                  onChange={() => toggleColumn(col.key)}
                  id={`col-toggle-${col.key}`}
                  className="rounded border-[#e5e7eb]"
                  data-testid={`col-toggle-${col.key}`}
                />
                <label
                  htmlFor={`col-toggle-${col.key}`}
                  className="flex-1 text-sm text-[#1a1a2e]"
                >
                  {col.label}
                </label>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => reorderColumn(col.key, "up")}
                    disabled={idx === 0}
                    className="rounded p-0.5 text-[#6b7280] hover:bg-gray-100 disabled:opacity-30"
                    aria-label={`Move ${col.label} up`}
                    data-testid={`col-up-${col.key}`}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => reorderColumn(col.key, "down")}
                    disabled={idx === allColumns.length - 1}
                    className="rounded p-0.5 text-[#6b7280] hover:bg-gray-100 disabled:opacity-30"
                    aria-label={`Move ${col.label} down`}
                    data-testid={`col-down-${col.key}`}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-[#e5e7eb] px-4 py-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={resetToDefault}
              data-testid="reset-columns"
            >
              Reset to Default
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
