import { describe, it, expect } from 'vitest';
import {
  detectCsvFormat,
  parseCSV,
  validateParsedRows,
} from '../components/CsvParser';

describe('detectCsvFormat', () => {
  it('identifies comma delimiter', () => {
    const text = 'Date,Description,Amount\n2026-01-15,Payment,1500\n2026-01-16,Rent,-2000';
    const result = detectCsvFormat(text);
    expect(result.delimiter).toBe(',');
  });

  it('identifies semicolon delimiter', () => {
    const text = 'Date;Description;Amount\n2026-01-15;Payment;1500\n2026-01-16;Rent;-2000';
    const result = detectCsvFormat(text);
    expect(result.delimiter).toBe(';');
  });

  it('identifies tab delimiter', () => {
    const text = 'Date\tDescription\tAmount\n2026-01-15\tPayment\t1500\n2026-01-16\tRent\t-2000';
    const result = detectCsvFormat(text);
    expect(result.delimiter).toBe('\t');
  });

  it('detects header row when first row contains text headers', () => {
    const text = 'Date,Description,Amount\n2026-01-15,Payment,1500';
    const result = detectCsvFormat(text);
    expect(result.hasHeader).toBe(true);
  });

  it('detects no header when first row looks like data', () => {
    const text = '2026-01-15,Payment,1500\n2026-01-16,Rent,-2000';
    const result = detectCsvFormat(text);
    expect(result.hasHeader).toBe(false);
  });

  it('returns sample rows', () => {
    const text = 'Date,Description,Amount\n2026-01-15,Payment,1500\n2026-01-16,Rent,-2000';
    const result = detectCsvFormat(text);
    expect(result.sampleRows.length).toBeGreaterThan(0);
    expect(result.sampleRows[0]).toEqual(['Date', 'Description', 'Amount']);
  });
});

describe('parseCSV', () => {
  it('parses with default options (comma, header, YYYY-MM-DD)', () => {
    const text = 'Date,Description,Amount\n2026-01-15,Payment from Client,1500\n2026-01-16,Office rent,-2000';
    const rows = parseCSV(text);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      date: '2026-01-15',
      description: 'Payment from Client',
      amount: 1500,
    });
    expect(rows[1]).toEqual({
      date: '2026-01-16',
      description: 'Office rent',
      amount: -2000,
    });
  });

  it('parses with semicolon delimiter', () => {
    const text = 'Date;Description;Amount\n2026-01-15;Payment;1500';
    const rows = parseCSV(text, { delimiter: ';' });
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('Payment');
    expect(rows[0].amount).toBe(1500);
  });

  it('parses with DD/MM/YYYY date format', () => {
    const text = 'Date,Description,Amount\n15/01/2026,Payment,1500';
    const rows = parseCSV(text, { dateFormat: 'DD/MM/YYYY' });
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe('2026-01-15');
  });

  it('parses with MM/DD/YYYY date format', () => {
    const text = 'Date,Description,Amount\n01/15/2026,Payment,1500';
    const rows = parseCSV(text, { dateFormat: 'MM/DD/YYYY' });
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe('2026-01-15');
  });

  it('parses with separate debit/credit columns', () => {
    const text = 'Date,Description,Debit,Credit\n2026-01-15,Payment,,1500\n2026-01-16,Rent,2000,';
    const rows = parseCSV(text, {
      columnMapping: { date: 0, description: 1, amount: -1, debit: 2, credit: 3 },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].amount).toBe(1500);   // credit = positive (money in)
    expect(rows[1].amount).toBe(-2000);   // debit = negative (money out)
  });

  it('parses with custom column mapping', () => {
    const text = 'Ref,When,What,How Much\nREF001,2026-01-15,Payment,1500';
    const rows = parseCSV(text, {
      columnMapping: { date: 1, description: 2, amount: 3, reference: 0 },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe('2026-01-15');
    expect(rows[0].description).toBe('Payment');
    expect(rows[0].amount).toBe(1500);
    expect(rows[0].reference).toBe('REF001');
  });

  it('parses without header row', () => {
    const text = '2026-01-15,Payment,1500';
    const rows = parseCSV(text, { hasHeader: false });
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe('2026-01-15');
  });

  it('skips empty lines', () => {
    const text = 'Date,Description,Amount\n\n2026-01-15,Payment,1500\n\n2026-01-16,Rent,-2000\n';
    const rows = parseCSV(text);
    expect(rows).toHaveLength(2);
  });

  it('handles quoted fields with commas', () => {
    const text = 'Date,Description,Amount\n2026-01-15,"Payment, from Client",1500';
    const rows = parseCSV(text);
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('Payment, from Client');
  });
});

describe('validateParsedRows', () => {
  it('passes valid rows through', () => {
    const rows = [
      { date: '2026-01-15', description: 'Payment', amount: 1500 },
      { date: '2026-01-16', description: 'Rent', amount: -2000 },
    ];
    const result = validateParsedRows(rows);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it('filters rows with invalid dates', () => {
    const rows = [
      { date: 'not-a-date', description: 'Payment', amount: 1500 },
      { date: '2026-01-16', description: 'Rent', amount: -2000 },
    ];
    const result = validateParsedRows(rows);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('not-a-date');
  });

  it('filters rows with NaN amount', () => {
    const rows = [
      { date: '2026-01-15', description: 'Payment', amount: NaN },
      { date: '2026-01-16', description: 'Rent', amount: -2000 },
    ];
    const result = validateParsedRows(rows);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });

  it('filters rows with empty description', () => {
    const rows = [
      { date: '2026-01-15', description: '', amount: 1500 },
      { date: '2026-01-16', description: 'Rent', amount: -2000 },
    ];
    const result = validateParsedRows(rows);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });

  it('reports multiple errors', () => {
    const rows = [
      { date: 'bad', description: '', amount: NaN },
    ];
    const result = validateParsedRows(rows);
    expect(result.valid).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
