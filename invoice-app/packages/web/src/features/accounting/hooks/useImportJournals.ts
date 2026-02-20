import { useState, useCallback } from "react";
import { apiPost } from "../../../lib/api-helpers";

export interface CsvColumnMapping {
  date: number;
  account: number;
  debit: number;
  credit: number;
  description: number;
  reference: number;
}

export interface ParsedJournalEntry {
  date: string;
  account: string;
  debit: number;
  credit: number;
  description: string;
  reference: string;
}

export interface ImportValidationError {
  row: number;
  message: string;
}

export interface JournalGroup {
  reference: string;
  entries: ParsedJournalEntry[];
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
}

export interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: ImportValidationError[];
}

export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(current);
        current = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && i + 1 < text.length && text[i + 1] === "\n") {
          i++;
        }
        row.push(current);
        current = "";
        if (row.some((c) => c.trim() !== "")) {
          rows.push(row);
        }
        row = [];
      } else {
        current += ch;
      }
    }
  }
  // Final row
  row.push(current);
  if (row.some((c) => c.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

export function mapCsvToEntries(
  rows: string[][],
  mapping: CsvColumnMapping,
  skipHeader: boolean,
): ParsedJournalEntry[] {
  const dataRows = skipHeader ? rows.slice(1) : rows;
  return dataRows.map((row) => ({
    date: (row[mapping.date] ?? "").trim(),
    account: (row[mapping.account] ?? "").trim(),
    debit: parseFloat(row[mapping.debit] ?? "0") || 0,
    credit: parseFloat(row[mapping.credit] ?? "0") || 0,
    description: (row[mapping.description] ?? "").trim(),
    reference: (row[mapping.reference] ?? "").trim(),
  }));
}

export function groupByReference(entries: ParsedJournalEntry[]): JournalGroup[] {
  const groups = new Map<string, ParsedJournalEntry[]>();
  for (const entry of entries) {
    const ref = entry.reference || "UNREF";
    if (!groups.has(ref)) {
      groups.set(ref, []);
    }
    groups.get(ref)!.push(entry);
  }

  return Array.from(groups.entries()).map(([reference, groupEntries]) => {
    const totalDebits = groupEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = groupEntries.reduce((sum, e) => sum + e.credit, 0);
    return {
      reference,
      entries: groupEntries,
      totalDebits,
      totalCredits,
      balanced: Math.abs(totalDebits - totalCredits) < 0.01,
    };
  });
}

export function validateJournalGroups(
  groups: JournalGroup[],
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  for (const group of groups) {
    if (!group.balanced) {
      errors.push({
        row: 0,
        message: `Journal "${group.reference}" is unbalanced: debits=${group.totalDebits.toFixed(2)}, credits=${group.totalCredits.toFixed(2)}`,
      });
    }
    for (const entry of group.entries) {
      if (!entry.date) {
        errors.push({
          row: 0,
          message: `Journal "${group.reference}" has an entry with no date`,
        });
      }
      if (!entry.account) {
        errors.push({
          row: 0,
          message: `Journal "${group.reference}" has an entry with no account`,
        });
      }
    }
  }
  return errors;
}

export interface ImportJournalsHook {
  step: number;
  setStep: (step: number) => void;
  csvRows: string[][];
  setCsvRows: (rows: string[][]) => void;
  mapping: CsvColumnMapping;
  setMapping: (mapping: CsvColumnMapping) => void;
  entries: ParsedJournalEntry[];
  groups: JournalGroup[];
  errors: ImportValidationError[];
  importResult: ImportResult | null;
  parseCsv: (text: string) => void;
  applyMapping: () => void;
  runImport: () => Promise<void>;
}

export function useImportJournals(): ImportJournalsHook {
  const [step, setStep] = useState(1);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({
    date: 0,
    account: 1,
    debit: 2,
    credit: 3,
    description: 4,
    reference: 5,
  });
  const [entries, setEntries] = useState<ParsedJournalEntry[]>([]);
  const [groups, setGroups] = useState<JournalGroup[]>([]);
  const [errors, setErrors] = useState<ImportValidationError[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const parseCsv = useCallback((text: string) => {
    const rows = parseCsvText(text);
    setCsvRows(rows);
  }, []);

  const applyMapping = useCallback(() => {
    const mapped = mapCsvToEntries(csvRows, mapping, true);
    setEntries(mapped);
    const grouped = groupByReference(mapped);
    setGroups(grouped);
    const validationErrors = validateJournalGroups(grouped);
    setErrors(validationErrors);
  }, [csvRows, mapping]);

  const runImport = useCallback(async () => {
    const balanced = groups.filter((g) => g.balanced);
    const unbalanced = groups.filter((g) => !g.balanced);
    const importErrors: ImportValidationError[] = unbalanced.map((g) => ({
      row: 0,
      message: `Unbalanced journal: ${g.reference}`,
    }));

    let successCount = 0;
    for (const group of balanced) {
      try {
        const firstEntry = group.entries[0];
        await apiPost('/journals', {
          date: firstEntry.date,
          narration: `Import: ${group.reference}`,
          lines: group.entries.map((entry) => ({
            accountId: entry.account,
            accountName: entry.account,
            description: entry.description,
            debit: entry.debit,
            credit: entry.credit,
          })),
        });
        successCount++;
      } catch (err) {
        importErrors.push({
          row: 0,
          message: `Failed to import journal "${group.reference}": ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    setImportResult({
      successCount,
      errorCount: unbalanced.length + (balanced.length - successCount),
      errors: importErrors,
    });
  }, [groups]);

  return {
    step,
    setStep,
    csvRows,
    setCsvRows,
    mapping,
    setMapping,
    entries,
    groups,
    errors,
    importResult,
    parseCsv,
    applyMapping,
    runImport,
  };
}
