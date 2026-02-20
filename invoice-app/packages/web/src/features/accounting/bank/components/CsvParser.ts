import type { ImportTransactionRow } from '../types';

export interface CsvColumnMapping {
  date: number;
  description: number;
  amount: number;
  reference?: number;
  debit?: number;
  credit?: number;
}

export interface ParseOptions {
  delimiter?: ',' | ';' | '\t';
  hasHeader?: boolean;
  dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  columnMapping?: CsvColumnMapping;
}

/**
 * Split a CSV line respecting quoted fields.
 * Handles fields like: "Payment, from Client"
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Check if a string looks like a common CSV header name (not a data value).
 */
function looksLikeHeader(value: string): boolean {
  const headerPatterns = [
    /^date$/i,
    /^description$/i,
    /^amount$/i,
    /^debit$/i,
    /^credit$/i,
    /^reference$/i,
    /^memo$/i,
    /^payee$/i,
    /^transaction/i,
    /^balance$/i,
    /^ref/i,
    /^type$/i,
    /^category$/i,
    /^account$/i,
    /^note/i,
    /^detail/i,
  ];
  return headerPatterns.some((p) => p.test(value.trim()));
}

/**
 * Auto-detect CSV delimiter, header presence, and return sample rows.
 */
export function detectCsvFormat(text: string): {
  delimiter: string;
  hasHeader: boolean;
  sampleRows: string[][];
} {
  const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { delimiter: ',', hasHeader: false, sampleRows: [] };
  }

  // Detect delimiter by counting occurrences on the first line
  const firstLine = lines[0];
  const delimiters = [',', ';', '\t'] as const;
  let bestDelimiter: string = ',';
  let bestCount = 0;

  for (const d of delimiters) {
    // Count delimiter occurrences outside quotes
    let count = 0;
    let inQuotes = false;
    for (const ch of firstLine) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === d && !inQuotes) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestDelimiter = d;
    }
  }

  // Parse sample rows
  const sampleRows = lines.slice(0, Math.min(lines.length, 5)).map((line) =>
    splitCsvLine(line, bestDelimiter),
  );

  // Detect if first row is a header
  const firstRow = sampleRows[0];
  const hasHeader =
    firstRow.length > 0 &&
    firstRow.some((cell) => looksLikeHeader(cell));

  return { delimiter: bestDelimiter, hasHeader, sampleRows };
}

/**
 * Auto-detect column mapping from header names.
 */
export function autoDetectMapping(headers: string[]): CsvColumnMapping {
  const mapping: CsvColumnMapping = { date: 0, description: 1, amount: 2 };

  const lower = headers.map((h) => h.toLowerCase().trim());

  for (let i = 0; i < lower.length; i++) {
    if (/date/.test(lower[i])) mapping.date = i;
    else if (/desc|memo|payee|detail|narrat/.test(lower[i])) mapping.description = i;
    else if (/^amount$/.test(lower[i])) mapping.amount = i;
    else if (/ref/.test(lower[i])) mapping.reference = i;
    else if (/debit/.test(lower[i])) mapping.debit = i;
    else if (/credit/.test(lower[i])) mapping.credit = i;
  }

  return mapping;
}

/**
 * Convert a date string from the given format to YYYY-MM-DD.
 */
function convertDate(dateStr: string, format?: string): string {
  const s = dateStr.trim();
  if (!format || format === 'YYYY-MM-DD') return s;

  if (format === 'DD/MM/YYYY') {
    const parts = s.split(/[/\-\.]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  if (format === 'MM/DD/YYYY') {
    const parts = s.split(/[/\-\.]/);
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return s;
}

/**
 * Parse CSV text into ImportTransactionRow[].
 * Auto-detects format if no options provided.
 */
export function parseCSV(text: string, options?: ParseOptions): ImportTransactionRow[] {
  const detected = detectCsvFormat(text);
  const delimiter = options?.delimiter ?? detected.delimiter;
  const hasHeader = options?.hasHeader ?? detected.hasHeader;
  const dateFormat = options?.dateFormat;

  const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const parsedLines = lines.map((line) => splitCsvLine(line, delimiter));

  // Determine column mapping
  let mapping: CsvColumnMapping;
  if (options?.columnMapping) {
    mapping = options.columnMapping;
  } else if (hasHeader) {
    mapping = autoDetectMapping(parsedLines[0]);
  } else {
    mapping = { date: 0, description: 1, amount: 2 };
  }

  const startIdx = hasHeader ? 1 : 0;
  const rows: ImportTransactionRow[] = [];

  for (let i = startIdx; i < parsedLines.length; i++) {
    const fields = parsedLines[i];
    if (fields.length < 2) continue;

    const dateRaw = fields[mapping.date] ?? '';
    const description = fields[mapping.description] ?? '';
    const date = convertDate(dateRaw, dateFormat);

    let amount: number;
    if (mapping.debit !== undefined || mapping.credit !== undefined) {
      // Separate debit/credit columns
      const debitStr = mapping.debit !== undefined ? fields[mapping.debit] ?? '' : '';
      const creditStr = mapping.credit !== undefined ? fields[mapping.credit] ?? '' : '';
      const debit = parseFloat(debitStr) || 0;
      const credit = parseFloat(creditStr) || 0;
      amount = credit - debit; // credit is money in (+), debit is money out (-)
    } else {
      amount = parseFloat(fields[mapping.amount] ?? '');
    }

    if (isNaN(amount)) continue;

    const row: ImportTransactionRow = { date, description, amount };

    if (mapping.reference !== undefined) {
      const ref = fields[mapping.reference]?.trim();
      if (ref) row.reference = ref;
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Validate parsed rows, separating valid from invalid.
 */
export function validateParsedRows(
  rows: ImportTransactionRow[],
): { valid: ImportTransactionRow[]; errors: string[] } {
  const valid: ImportTransactionRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const rowErrors: string[] = [];

    // Validate date: must be a parseable date
    if (!row.date || isNaN(new Date(row.date).getTime())) {
      rowErrors.push(`Row ${rowNum}: Invalid date "${row.date}"`);
    }

    // Validate amount
    if (isNaN(row.amount)) {
      rowErrors.push(`Row ${rowNum}: Invalid amount`);
    }

    // Validate description
    if (!row.description || row.description.trim() === '') {
      rowErrors.push(`Row ${rowNum}: Empty description`);
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      valid.push(row);
    }
  }

  return { valid, errors };
}
