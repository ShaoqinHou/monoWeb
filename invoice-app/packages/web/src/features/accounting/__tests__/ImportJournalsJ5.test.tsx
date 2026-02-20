import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  parseCsvText,
  mapCsvToEntries,
  groupByReference,
  validateJournalGroups,
  useImportJournals,
  type CsvColumnMapping,
} from "../hooks/useImportJournals";

describe("parseCsvText", () => {
  it("parses simple CSV rows", () => {
    const csv = "Date,Account,Debit,Credit\n2024-01-15,Sales,100,0\n2024-01-15,Cash,0,100";
    const rows = parseCsvText(csv);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(["Date", "Account", "Debit", "Credit"]);
    expect(rows[1]).toEqual(["2024-01-15", "Sales", "100", "0"]);
  });

  it("handles quoted fields with commas", () => {
    const csv = '"Name","Amount"\n"Smith, John","100"';
    const rows = parseCsvText(csv);
    expect(rows[1][0]).toBe("Smith, John");
  });
});

describe("mapCsvToEntries", () => {
  it("maps CSV rows to journal entries using column mapping", () => {
    const rows = [
      ["Date", "Account", "Debit", "Credit", "Desc", "Ref"],
      ["2024-01-15", "Sales", "100", "0", "Sale", "JE001"],
      ["2024-01-15", "Cash", "0", "100", "Payment", "JE001"],
    ];
    const mapping: CsvColumnMapping = {
      date: 0,
      account: 1,
      debit: 2,
      credit: 3,
      description: 4,
      reference: 5,
    };

    const entries = mapCsvToEntries(rows, mapping, true);
    expect(entries).toHaveLength(2);
    expect(entries[0].date).toBe("2024-01-15");
    expect(entries[0].account).toBe("Sales");
    expect(entries[0].debit).toBe(100);
    expect(entries[0].credit).toBe(0);
    expect(entries[0].reference).toBe("JE001");
  });
});

describe("groupByReference + validateJournalGroups", () => {
  it("validates that debits must equal credits per journal", () => {
    const entries = [
      { date: "2024-01-15", account: "Sales", debit: 100, credit: 0, description: "", reference: "JE001" },
      { date: "2024-01-15", account: "Cash", debit: 0, credit: 100, description: "", reference: "JE001" },
    ];

    const groups = groupByReference(entries);
    expect(groups).toHaveLength(1);
    expect(groups[0].balanced).toBe(true);

    const errors = validateJournalGroups(groups);
    expect(errors).toHaveLength(0);
  });

  it("detects unbalanced journals", () => {
    const entries = [
      { date: "2024-01-15", account: "Sales", debit: 100, credit: 0, description: "", reference: "JE002" },
      { date: "2024-01-15", account: "Cash", debit: 0, credit: 50, description: "", reference: "JE002" },
    ];

    const groups = groupByReference(entries);
    expect(groups[0].balanced).toBe(false);

    const errors = validateJournalGroups(groups);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("unbalanced");
  });

  it("groups entries by reference", () => {
    const entries = [
      { date: "2024-01-15", account: "Sales", debit: 100, credit: 0, description: "", reference: "JE001" },
      { date: "2024-01-15", account: "Cash", debit: 0, credit: 100, description: "", reference: "JE001" },
      { date: "2024-01-16", account: "Expense", debit: 50, credit: 0, description: "", reference: "JE002" },
      { date: "2024-01-16", account: "Cash", debit: 0, credit: 50, description: "", reference: "JE002" },
    ];

    const groups = groupByReference(entries);
    expect(groups).toHaveLength(2);
    expect(groups[0].reference).toBe("JE001");
    expect(groups[1].reference).toBe("JE002");
  });
});

describe("useImportJournals", () => {
  it("parses CSV and applies mapping", () => {
    const { result } = renderHook(() => useImportJournals());

    act(() => {
      result.current.parseCsv(
        "Date,Account,Debit,Credit,Desc,Ref\n2024-01-15,Sales,100,0,Sale,JE001\n2024-01-15,Cash,0,100,Pay,JE001",
      );
    });

    expect(result.current.csvRows).toHaveLength(3);

    act(() => {
      result.current.applyMapping();
    });

    expect(result.current.entries).toHaveLength(2);
    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0].balanced).toBe(true);
    expect(result.current.errors).toHaveLength(0);
  });
});
