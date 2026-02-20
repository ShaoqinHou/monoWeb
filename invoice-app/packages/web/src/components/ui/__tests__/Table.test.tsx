import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../Table";

describe("Table", () => {
  function renderTable() {
    return render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Invoice #001</TableCell>
            <TableCell>$100.00</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Invoice #002</TableCell>
            <TableCell>$250.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
  }

  it("renders a table element", () => {
    renderTable();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders column headers", () => {
    renderTable();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });

  it("renders row data", () => {
    renderTable();
    expect(screen.getByText("Invoice #001")).toBeInTheDocument();
    expect(screen.getByText("$250.00")).toBeInTheDocument();
  });

  it("renders correct number of rows", () => {
    renderTable();
    const rows = screen.getAllByRole("row");
    // 1 header row + 2 body rows
    expect(rows).toHaveLength(3);
  });

  it("applies hover styles on rows", () => {
    renderTable();
    const rows = screen.getAllByRole("row");
    // Body rows should have hover class
    expect(rows[1].className).toContain("hover:bg-gray-50");
  });

  it("applies header background", () => {
    renderTable();
    const thead = screen.getByRole("table").querySelector("thead");
    expect(thead?.className).toContain("bg-[#f8f9fa]");
  });

  it("supports stickyHeader prop", () => {
    render(
      <Table stickyHeader>
        <TableHeader>
          <TableRow>
            <TableHead>Col</TableHead>
          </TableRow>
        </TableHeader>
      </Table>,
    );
    const table = screen.getByRole("table");
    expect(table.className).toContain("sticky");
  });

  it("merges custom className on Table", () => {
    render(
      <Table className="my-table">
        <TableBody>
          <TableRow>
            <TableCell>Data</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const table = screen.getByRole("table");
    expect(table.className).toContain("my-table");
  });
});
