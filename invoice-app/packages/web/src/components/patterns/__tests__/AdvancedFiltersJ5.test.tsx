import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AdvancedFilters } from "../AdvancedFilters";
import { useAdvancedFilters, type FilterFieldConfig } from "../../../lib/useAdvancedFilters";
import { renderHook, act } from "@testing-library/react";
import { SavedFilterPresets } from "../SavedFilterPresets";
import { useFilterPresets } from "../../../lib/useFilterPresets";
import { ColumnCustomizer } from "../ColumnCustomizer";
import { useColumnCustomization, type ColumnConfig } from "../../../lib/useColumnCustomization";
import { ExportButton } from "../ExportButton";
import { useExport } from "../../../lib/useExport";

const filterFields: FilterFieldConfig[] = [
  { key: "search", label: "Search", type: "text" },
  { key: "date", label: "Date", type: "dateRange" },
  { key: "amount", label: "Amount", type: "amountRange" },
  {
    key: "status",
    label: "Status",
    type: "status",
    options: [
      { value: "draft", label: "Draft" },
      { value: "sent", label: "Sent" },
      { value: "paid", label: "Paid" },
    ],
  },
  { key: "contact", label: "Contact", type: "contact" },
];

// Helper wrapper for AdvancedFilters
function FiltersWrapper() {
  const filtersState = useAdvancedFilters(filterFields);
  return <AdvancedFilters fields={filterFields} filtersState={filtersState} />;
}

describe("AdvancedFilters", () => {
  beforeEach(() => {
    // Reset URL params
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("renders all filter field types", () => {
    render(<FiltersWrapper />);
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders status filter options as buttons", () => {
    render(<FiltersWrapper />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("shows Apply Filters and Clear All buttons", () => {
    render(<FiltersWrapper />);
    expect(screen.getByTestId("apply-filters")).toHaveTextContent("Apply Filters");
    expect(screen.getByTestId("clear-filters")).toHaveTextContent("Clear All");
  });

  it("collapses and shows active filter count", async () => {
    const user = userEvent.setup();
    render(<FiltersWrapper />);

    // Collapse the panel
    await user.click(screen.getByTestId("filter-toggle"));

    // Filter fields should not be visible
    expect(screen.queryByTestId("filter-fields")).not.toBeInTheDocument();
  });
});

describe("useAdvancedFilters", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("syncs filter state with URL params", () => {
    // Pre-set URL params
    window.history.replaceState(null, "", "?f_search=test&f_status=draft,sent");

    const { result } = renderHook(() => useAdvancedFilters(filterFields));

    expect(result.current.filters.search).toBe("test");
    expect(result.current.filters.status).toEqual(["draft", "sent"]);
    expect(result.current.activeCount).toBe(2);
  });

  it("writes to URL params on applyFilters", () => {
    const { result } = renderHook(() => useAdvancedFilters(filterFields));

    act(() => {
      result.current.applyFilters({ search: "hello" });
    });

    expect(window.location.search).toContain("f_search=hello");
    expect(result.current.filters.search).toBe("hello");
    expect(result.current.activeCount).toBe(1);
  });

  it("clearFilters removes all filters and URL params", () => {
    window.history.replaceState(null, "", "?f_search=test");

    const { result } = renderHook(() => useAdvancedFilters(filterFields));

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.activeCount).toBe(0);
    expect(window.location.search).toBe("");
  });
});

describe("SavedFilterPresets", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("performs CRUD on filter presets in localStorage", () => {
    const { result } = renderHook(() => useFilterPresets("invoices"));

    // Save
    act(() => {
      result.current.savePreset("Overdue", { status: ["overdue"] });
    });
    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].name).toBe("Overdue");

    // Load
    const loaded = result.current.loadPreset(result.current.presets[0].id);
    expect(loaded).toEqual({ status: ["overdue"] });

    // Delete
    const id = result.current.presets[0].id;
    act(() => {
      result.current.deletePreset(id);
    });
    expect(result.current.presets).toHaveLength(0);

    // Verify localStorage is clean
    const stored = JSON.parse(
      localStorage.getItem("xero_filter_presets_invoices") ?? "[]",
    );
    expect(stored).toHaveLength(0);
  });
});

describe("ColumnCustomizer", () => {
  const defaultColumns: ColumnConfig[] = [
    { key: "date", label: "Date", visible: true },
    { key: "number", label: "Number", visible: true },
    { key: "contact", label: "Contact", visible: true },
    { key: "amount", label: "Amount", visible: true },
    { key: "status", label: "Status", visible: true },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it("toggles column visibility", () => {
    const { result } = renderHook(() =>
      useColumnCustomization("invoices", defaultColumns),
    );

    expect(result.current.visibleColumns).toHaveLength(5);

    act(() => {
      result.current.toggleColumn("contact");
    });

    expect(result.current.visibleColumns).toHaveLength(4);
    expect(
      result.current.visibleColumns.find((c) => c.key === "contact"),
    ).toBeUndefined();
  });

  it("persists column config to localStorage", () => {
    const { result } = renderHook(() =>
      useColumnCustomization("invoices", defaultColumns),
    );

    act(() => {
      result.current.toggleColumn("amount");
    });

    const stored = JSON.parse(
      localStorage.getItem("xero_column_config_invoices") ?? "[]",
    );
    const amountCol = stored.find((c: ColumnConfig) => c.key === "amount");
    expect(amountCol.visible).toBe(false);
  });

  it("resets to default removes localStorage", () => {
    const { result } = renderHook(() =>
      useColumnCustomization("invoices", defaultColumns),
    );

    act(() => {
      result.current.toggleColumn("date");
    });
    expect(result.current.visibleColumns).toHaveLength(4);

    act(() => {
      result.current.resetToDefault();
    });
    expect(result.current.visibleColumns).toHaveLength(5);
    expect(localStorage.getItem("xero_column_config_invoices")).toBeNull();
  });
});

describe("ExportButton", () => {
  it("renders export dropdown with CSV and PDF options", async () => {
    const user = userEvent.setup();

    function Wrapper() {
      const state = useExport(
        [{ name: "Test", amount: 100 }],
        [
          { key: "name", header: "Name" },
          { key: "amount", header: "Amount" },
        ],
        "test-export",
      );
      return <ExportButton exportState={state} />;
    }

    render(<Wrapper />);

    // Open dropdown
    await user.click(screen.getByTestId("export-toggle"));

    expect(screen.getByTestId("export-csv")).toHaveTextContent("Export as CSV");
    expect(screen.getByTestId("export-pdf")).toHaveTextContent("Export as PDF");
  });
});
