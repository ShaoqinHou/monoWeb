import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DataTable, type Column } from "../DataTable";

interface TestRow {
  id: number;
  name: string;
  email: string;
  amount: number;
  [key: string]: unknown;
}

const testColumns: Column<TestRow>[] = [
  { header: "Name", accessor: "name", sortable: true },
  { header: "Email", accessor: "email", sortable: true },
  {
    header: "Amount",
    accessor: "amount",
    sortable: true,
    render: (row) => `$${row.amount.toFixed(2)}`,
  },
];

const testData: TestRow[] = [
  { id: 1, name: "Alice", email: "alice@example.com", amount: 100 },
  { id: 2, name: "Bob", email: "bob@example.com", amount: 200 },
  { id: 3, name: "Charlie", email: "charlie@example.com", amount: 50 },
  { id: 4, name: "Diana", email: "diana@example.com", amount: 300 },
  { id: 5, name: "Eve", email: "eve@example.com", amount: 150 },
];

describe("DataTable", () => {
  describe("rendering", () => {
    it("renders column headers", () => {
      render(<DataTable columns={testColumns} data={testData} />);
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Amount")).toBeInTheDocument();
    });

    it("renders all rows", () => {
      render(<DataTable columns={testColumns} data={testData} />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    it("uses custom render function for cells", () => {
      render(<DataTable columns={testColumns} data={testData} />);
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("$200.00")).toBeInTheDocument();
    });

    it("shows empty message when no data", () => {
      render(
        <DataTable
          columns={testColumns}
          data={[]}
          emptyMessage="No records found"
        />,
      );
      expect(screen.getByText("No records found")).toBeInTheDocument();
    });

    it("shows default empty message", () => {
      render(<DataTable columns={testColumns} data={[]} />);
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("sorts ascending on first click", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={testColumns} data={testData} />);

      await user.click(screen.getByText("Name"));

      const rows = screen.getAllByRole("row");
      // First row is header, data rows start at index 1
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText("Alice")).toBeInTheDocument();
    });

    it("sorts descending on second click", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={testColumns} data={testData} />);

      const nameHeader = screen.getByText("Name");
      await user.click(nameHeader);
      await user.click(nameHeader);

      const rows = screen.getAllByRole("row");
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText("Eve")).toBeInTheDocument();
    });

    it("sorts numbers correctly", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={testColumns} data={testData} />);

      await user.click(screen.getByText("Amount"));

      const rows = screen.getAllByRole("row");
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText("$50.00")).toBeInTheDocument();
    });

    it("does not sort non-sortable columns", async () => {
      const columns: Column<TestRow>[] = [
        { header: "Name", accessor: "name", sortable: false },
        { header: "Email", accessor: "email" },
      ];
      const user = userEvent.setup();
      render(<DataTable columns={columns} data={testData} />);

      const nameHeader = screen.getByText("Name");
      await user.click(nameHeader);

      // Order should remain as original (no sort applied)
      const rows = screen.getAllByRole("row");
      const firstDataRow = rows[1];
      expect(within(firstDataRow).getByText("Alice")).toBeInTheDocument();
    });
  });

  describe("search", () => {
    it("renders search input when searchable is true", () => {
      render(
        <DataTable columns={testColumns} data={testData} searchable />,
      );
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("does not render search input when searchable is false", () => {
      render(<DataTable columns={testColumns} data={testData} />);
      expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
    });

    it("filters rows based on search text", async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={testColumns} data={testData} searchable />,
      );

      await user.type(screen.getByPlaceholderText("Search..."), "alice");

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.queryByText("Bob")).not.toBeInTheDocument();
      expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    });

    it("search is case-insensitive", async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={testColumns} data={testData} searchable />,
      );

      await user.type(screen.getByPlaceholderText("Search..."), "BOB");
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("shows empty message when search has no results", async () => {
      const user = userEvent.setup();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          searchable
          emptyMessage="Nothing found"
        />,
      );

      await user.type(
        screen.getByPlaceholderText("Search..."),
        "zzz_no_match",
      );
      expect(screen.getByText("Nothing found")).toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    // Generate 30 rows for pagination testing
    const manyRows: TestRow[] = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      name: `User ${String(i + 1).padStart(2, "0")}`,
      email: `user${i + 1}@example.com`,
      amount: (i + 1) * 10,
    }));

    it("paginates data with default page size of 10", () => {
      render(
        <DataTable columns={testColumns} data={manyRows} pagination />,
      );

      expect(screen.getByText("User 01")).toBeInTheDocument();
      expect(screen.getByText("User 10")).toBeInTheDocument();
      expect(screen.queryByText("User 11")).not.toBeInTheDocument();
    });

    it("shows pagination info text", () => {
      render(
        <DataTable columns={testColumns} data={manyRows} pagination />,
      );
      expect(screen.getByText("1-10 of 30")).toBeInTheDocument();
    });

    it("navigates to next page", async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={testColumns} data={manyRows} pagination />,
      );

      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(screen.queryByText("User 10")).not.toBeInTheDocument();
      expect(screen.getByText("User 11")).toBeInTheDocument();
      expect(screen.getByText("User 20")).toBeInTheDocument();
      expect(screen.getByText("11-20 of 30")).toBeInTheDocument();
    });

    it("navigates to previous page", async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={testColumns} data={manyRows} pagination />,
      );

      // Go to page 2
      await user.click(screen.getByRole("button", { name: /next/i }));
      // Go back to page 1
      await user.click(screen.getByRole("button", { name: /previous/i }));

      expect(screen.getByText("User 01")).toBeInTheDocument();
      expect(screen.getByText("1-10 of 30")).toBeInTheDocument();
    });

    it("disables previous button on first page", () => {
      render(
        <DataTable columns={testColumns} data={manyRows} pagination />,
      );
      const prevButton = screen.getByRole("button", { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it("disables next button on last page", async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={testColumns} data={manyRows} pagination />,
      );

      // Navigate to last page (page 3 for 30 items with page size 10)
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it("allows changing page size", async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={testColumns} data={manyRows} pagination />,
      );

      const pageSizeSelect = screen.getByDisplayValue("10");
      await user.selectOptions(pageSizeSelect, "25");

      expect(screen.getByText("User 01")).toBeInTheDocument();
      expect(screen.getByText("User 25")).toBeInTheDocument();
      expect(screen.queryByText("User 26")).not.toBeInTheDocument();
      expect(screen.getByText("1-25 of 30")).toBeInTheDocument();
    });

    it("resets to page 1 when page size changes", async () => {
      const user = userEvent.setup();
      render(
        <DataTable columns={testColumns} data={manyRows} pagination />,
      );

      // Go to page 2
      await user.click(screen.getByRole("button", { name: /next/i }));
      expect(screen.getByText("11-20 of 30")).toBeInTheDocument();

      // Change page size
      const pageSizeSelect = screen.getByDisplayValue("10");
      await user.selectOptions(pageSizeSelect, "25");

      // Should reset to page 1
      expect(screen.getByText("1-25 of 30")).toBeInTheDocument();
    });
  });

  describe("row click", () => {
    it("calls onRowClick when a row is clicked", async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          onRowClick={onRowClick}
        />,
      );

      await user.click(screen.getByText("Alice"));

      expect(onRowClick).toHaveBeenCalledWith(testData[0]);
    });

    it("adds cursor-pointer to rows when onRowClick is set", () => {
      render(
        <DataTable
          columns={testColumns}
          data={testData}
          onRowClick={vi.fn()}
        />,
      );

      const rows = screen.getAllByRole("row");
      // Data rows (skip header)
      expect(rows[1].className).toContain("cursor-pointer");
    });
  });
});
