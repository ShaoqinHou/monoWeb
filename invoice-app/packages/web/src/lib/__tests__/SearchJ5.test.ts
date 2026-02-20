import { describe, it, expect } from "vitest";
import { generateCsv, type ExportColumn } from "../useExport";

describe("generateCsv", () => {
  const columns: ExportColumn[] = [
    { key: "name", header: "Name" },
    { key: "amount", header: "Amount" },
    { key: "date", header: "Date" },
  ];

  it("generates CSV with header row", () => {
    const csv = generateCsv([], columns);
    expect(csv).toBe("Name,Amount,Date");
  });

  it("generates CSV with data rows", () => {
    const data = [
      { name: "Invoice 001", amount: 100.5, date: "2024-01-15" },
      { name: "Invoice 002", amount: 250, date: "2024-02-01" },
    ];

    const csv = generateCsv(data, columns);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe("Name,Amount,Date");
    expect(lines[1]).toBe("Invoice 001,100.5,2024-01-15");
    expect(lines[2]).toBe("Invoice 002,250,2024-02-01");
  });

  it("escapes commas in values", () => {
    const data = [{ name: "Smith, John", amount: 100, date: "2024-01-15" }];
    const csv = generateCsv(data, columns);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"Smith, John",100,2024-01-15');
  });

  it("escapes double quotes in values", () => {
    const data = [
      { name: 'The "Best" Invoice', amount: 100, date: "2024-01-15" },
    ];
    const csv = generateCsv(data, columns);
    const lines = csv.split("\n");
    expect(lines[1]).toBe('"The ""Best"" Invoice",100,2024-01-15');
  });

  it("escapes newlines in values", () => {
    const data = [
      { name: "Line 1\nLine 2", amount: 100, date: "2024-01-15" },
    ];
    const csv = generateCsv(data, columns);
    const lines = csv.split("\n");
    // The value with newline should be quoted
    expect(csv).toContain('"Line 1\nLine 2"');
  });

  it("handles null and undefined values", () => {
    const data = [{ name: null, amount: undefined, date: "2024-01-15" }];
    const csv = generateCsv(
      data as unknown as Record<string, unknown>[],
      columns,
    );
    const lines = csv.split("\n");
    expect(lines[1]).toBe(",,2024-01-15");
  });

  it("uses custom format function when provided", () => {
    const customColumns: ExportColumn[] = [
      { key: "name", header: "Name" },
      {
        key: "amount",
        header: "Amount",
        format: (v) => `$${(v as number).toFixed(2)}`,
      },
    ];
    const data = [{ name: "Test", amount: 99.9 }];
    const csv = generateCsv(data, customColumns);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("Test,$99.90");
  });
});
