import { describe, it, expect } from 'vitest';
import { findMatches } from '../components/TransactionMatcher';
import type { ImportTransactionRow } from '../types';

const sampleInvoices = [
  { id: 'inv-1', number: 'INV-0001', contactName: 'Acme Corp', total: 1500, amountDue: 1500 },
  { id: 'inv-2', number: 'INV-0002', contactName: 'Widget Co', total: 2000, amountDue: 2000 },
  { id: 'inv-3', number: 'INV-0003', contactName: 'Globex Inc', total: 750, amountDue: 750 },
];

const sampleBills = [
  { id: 'bill-1', number: 'BILL-0001', contactName: 'Office Supplies Ltd', total: 500, amountDue: 500 },
  { id: 'bill-2', number: 'BILL-0002', contactName: 'Landlord Corp', total: 3000, amountDue: 3000 },
];

describe('TransactionMatcher - findMatches', () => {
  it('returns exact amount match with high confidence for invoices', () => {
    const tx: ImportTransactionRow = {
      date: '2026-01-15',
      description: 'Bank deposit',
      amount: 1500,
    };
    const matches = findMatches(tx, sampleInvoices, sampleBills);
    expect(matches.length).toBeGreaterThan(0);
    const invoiceMatch = matches.find((m) => m.entityId === 'inv-1');
    expect(invoiceMatch).toMatchObject({ confidence: 'high', reason: expect.stringContaining('exact') });
  });

  it('returns high confidence when description contains invoice number', () => {
    const tx: ImportTransactionRow = {
      date: '2026-01-15',
      description: 'Payment for INV-0002',
      amount: 999, // amount doesn't match
    };
    const matches = findMatches(tx, sampleInvoices, sampleBills);
    const invoiceMatch = matches.find((m) => m.entityId === 'inv-2');
    expect(invoiceMatch).toMatchObject({ confidence: 'high', reason: expect.stringContaining('number') });
  });

  it('returns medium confidence when description contains contact name', () => {
    const tx: ImportTransactionRow = {
      date: '2026-01-15',
      description: 'Transfer from Acme Corp',
      amount: 999, // amount doesn't match
    };
    const matches = findMatches(tx, sampleInvoices, sampleBills);
    const invoiceMatch = matches.find((m) => m.entityId === 'inv-1');
    expect(invoiceMatch).toMatchObject({ confidence: 'medium', reason: expect.stringContaining('contact') });
  });

  it('returns low confidence for close amount match (within 5%)', () => {
    const tx: ImportTransactionRow = {
      date: '2026-01-15',
      description: 'Some deposit',
      amount: 1530, // 2% over 1500
    };
    const matches = findMatches(tx, sampleInvoices, sampleBills);
    const invoiceMatch = matches.find((m) => m.entityId === 'inv-1');
    expect(invoiceMatch).toMatchObject({ confidence: 'low', reason: expect.stringContaining('close') });
  });

  it('positive amounts match invoices (money in)', () => {
    const tx: ImportTransactionRow = {
      date: '2026-01-15',
      description: 'Deposit',
      amount: 1500,
    };
    const matches = findMatches(tx, sampleInvoices, sampleBills);
    // Should match invoices, not bills
    const invoiceMatches = matches.filter((m) => m.entityType === 'invoice');
    const billMatches = matches.filter((m) => m.entityType === 'bill');
    expect(invoiceMatches.length).toBeGreaterThan(0);
    expect(billMatches).toHaveLength(0);
  });

  it('negative amounts match bills (money out)', () => {
    const tx: ImportTransactionRow = {
      date: '2026-01-15',
      description: 'Payment',
      amount: -500,
    };
    const matches = findMatches(tx, sampleInvoices, sampleBills);
    const invoiceMatches = matches.filter((m) => m.entityType === 'invoice');
    const billMatches = matches.filter((m) => m.entityType === 'bill');
    expect(billMatches.length).toBeGreaterThan(0);
    expect(invoiceMatches).toHaveLength(0);
  });

  it('returns empty array when no matches found', () => {
    const tx: ImportTransactionRow = {
      date: '2026-01-15',
      description: 'Random transfer',
      amount: 99999,
    };
    const matches = findMatches(tx, sampleInvoices, sampleBills);
    expect(matches).toHaveLength(0);
  });

  it('returns multiple matches sorted by confidence (high first)', () => {
    // Set up a transaction that matches multiple invoices in different ways
    const tx: ImportTransactionRow = {
      date: '2026-01-15',
      description: 'Payment from Acme Corp for INV-0003',
      amount: 750, // exact match on inv-3
    };
    const matches = findMatches(tx, sampleInvoices, sampleBills);
    expect(matches.length).toBeGreaterThanOrEqual(2);

    // Verify sorted: high confidence should come before medium/low
    const confidenceOrder = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < matches.length; i++) {
      expect(confidenceOrder[matches[i].confidence]).toBeGreaterThanOrEqual(
        confidenceOrder[matches[i - 1].confidence],
      );
    }
  });

  it('does not match amounts that differ by more than 5%', () => {
    const tx: ImportTransactionRow = {
      date: '2026-01-15',
      description: 'Deposit',
      amount: 1800, // 20% over 1500
    };
    const matches = findMatches(tx, sampleInvoices, sampleBills);
    const inv1Match = matches.find((m) => m.entityId === 'inv-1');
    // inv-1 has amountDue 1500, and 1800 is 20% different -- should NOT match on amount
    // It might still show if description matches, but not on amount
    if (inv1Match) {
      // If it appears, it should NOT be due to an amount match
      expect(inv1Match.reason).not.toContain('exact');
      expect(inv1Match.reason).not.toContain('close');
    }
  });

  it('sets label including entity number and contact name', () => {
    const tx: ImportTransactionRow = {
      date: '2026-01-15',
      description: 'Deposit',
      amount: 1500,
    };
    const matches = findMatches(tx, sampleInvoices, sampleBills);
    const inv1Match = matches.find((m) => m.entityId === 'inv-1');
    expect(inv1Match).toMatchObject({ label: expect.stringContaining('INV-0001') });
    expect(inv1Match!.label).toContain('Acme Corp');
  });
});
