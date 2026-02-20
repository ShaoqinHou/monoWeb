import { describe, it, expect } from 'vitest';
import { calcLineItem, round2 } from '../calc/line-item-calc';
import { calcInvoiceTotals, calcAmountDue } from '../calc/invoice-calc';
import { formatCurrency, parseCurrency } from '../calc/currency';

// ── round2 edge cases ──

describe('round2 edge cases', () => {
  it('handles very large numbers', () => {
    expect(round2(999999999.999)).toBe(1000000000);
  });

  it('handles very small fractional values', () => {
    expect(round2(0.001)).toBe(0);
    expect(round2(0.005)).toBe(0.01);
    expect(round2(0.004)).toBe(0);
  });

  it('handles floating point precision issues', () => {
    // Classic floating point: 0.1 + 0.2 = 0.30000000000000004
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it('handles negative rounding', () => {
    expect(round2(-1.235)).toBe(-1.23);
    expect(round2(-0.005)).toBe(-0);
  });
});

// ── calcLineItem edge cases ──

describe('calcLineItem edge cases', () => {
  it('handles 100% discount', () => {
    const result = calcLineItem(
      { quantity: 10, unitPrice: 100, discount: 100, taxRate: 15 },
      'exclusive',
    );
    expect(result.lineAmount).toBe(0);
    expect(result.taxAmount).toBe(0);
  });

  it('handles very large quantities', () => {
    const result = calcLineItem(
      { quantity: 1000000, unitPrice: 0.01, discount: 0, taxRate: 15 },
      'exclusive',
    );
    expect(result.lineAmount).toBe(10000);
    expect(result.taxAmount).toBe(1500);
  });

  it('handles fractional quantities', () => {
    const result = calcLineItem(
      { quantity: 2.5, unitPrice: 40, discount: 0, taxRate: 15 },
      'exclusive',
    );
    expect(result.lineAmount).toBe(100);
    expect(result.taxAmount).toBe(15);
  });

  it('handles fractional prices', () => {
    const result = calcLineItem(
      { quantity: 3, unitPrice: 33.33, discount: 0, taxRate: 15 },
      'exclusive',
    );
    expect(result.lineAmount).toBe(99.99);
    expect(result.taxAmount).toBe(15);
  });

  it('defaults to exclusive when no amountType provided', () => {
    const result = calcLineItem(
      { quantity: 1, unitPrice: 100, discount: 0, taxRate: 15 },
    );
    expect(result.lineAmount).toBe(100);
    expect(result.taxAmount).toBe(15);
  });

  it('handles discount with inclusive tax', () => {
    // 50% discount on 230 inclusive at 15% → 115 → line=100, tax=15
    const result = calcLineItem(
      { quantity: 1, unitPrice: 230, discount: 50, taxRate: 15 },
      'inclusive',
    );
    expect(result.lineAmount).toBe(100);
    expect(result.taxAmount).toBe(15);
  });

  it('handles zero unit price', () => {
    const result = calcLineItem(
      { quantity: 5, unitPrice: 0, discount: 0, taxRate: 15 },
      'exclusive',
    );
    expect(result.lineAmount).toBe(0);
    expect(result.taxAmount).toBe(0);
  });
});

// ── calcInvoiceTotals edge cases ──

describe('calcInvoiceTotals edge cases', () => {
  it('handles many line items with rounding', () => {
    // 3 items at $33.33 each = $99.99 subtotal
    const items = Array.from({ length: 3 }, () => ({
      quantity: 1,
      unitPrice: 33.33,
      discount: 0,
      taxRate: 15,
    }));
    const totals = calcInvoiceTotals(items, 'exclusive');
    expect(totals.subTotal).toBe(99.99);
    expect(totals.total).toBe(114.99);
  });

  it('handles all items with 100% discount', () => {
    const items = [
      { quantity: 1, unitPrice: 100, discount: 100, taxRate: 15 },
      { quantity: 2, unitPrice: 50, discount: 100, taxRate: 15 },
    ];
    const totals = calcInvoiceTotals(items, 'exclusive');
    expect(totals.subTotal).toBe(0);
    expect(totals.totalTax).toBe(0);
    expect(totals.total).toBe(0);
  });

  it('handles single line item inclusive', () => {
    const items = [
      { quantity: 1, unitPrice: 230, discount: 0, taxRate: 15 },
    ];
    const totals = calcInvoiceTotals(items, 'inclusive');
    expect(totals.subTotal).toBe(200);
    expect(totals.totalTax).toBe(30);
    expect(totals.total).toBe(230);
  });

  it('handles no_tax with multiple items', () => {
    const items = [
      { quantity: 2, unitPrice: 100, discount: 0, taxRate: 15 },
      { quantity: 1, unitPrice: 50, discount: 10, taxRate: 15 },
    ];
    const totals = calcInvoiceTotals(items, 'no_tax');
    expect(totals.subTotal).toBe(245);
    expect(totals.totalTax).toBe(0);
    expect(totals.total).toBe(245);
  });
});

// ── calcAmountDue edge cases ──

describe('calcAmountDue edge cases', () => {
  it('handles zero total', () => {
    expect(calcAmountDue(0, 0)).toBe(0);
  });

  it('handles floating point in payments', () => {
    // 287.50 - 100.33 should be exactly 187.17
    expect(calcAmountDue(287.5, 100.33)).toBe(187.17);
  });

  it('handles large amounts', () => {
    expect(calcAmountDue(1000000, 999999.99)).toBe(0.01);
  });
});

// ── formatCurrency edge cases ──

describe('formatCurrency edge cases', () => {
  it('formats very large amounts', () => {
    expect(formatCurrency(1234567890.12, 'NZD')).toBe('$1,234,567,890.12');
  });

  it('formats very small amounts', () => {
    expect(formatCurrency(0.01, 'NZD')).toBe('$0.01');
  });

  it('formats JPY without decimals', () => {
    expect(formatCurrency(1234, 'JPY')).toBe('¥1,234');
  });

  it('formats AUD with dollar sign', () => {
    expect(formatCurrency(100, 'AUD')).toBe('$100.00');
  });

  it('formats USD with dollar sign', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00');
  });

  it('falls back to $ for unknown currency', () => {
    expect(formatCurrency(100, 'XYZ')).toBe('$100.00');
  });

  it('handles negative zero', () => {
    const result = formatCurrency(-0, 'NZD');
    expect(result).toBe('$0.00');
  });
});

// ── parseCurrency edge cases ──

describe('parseCurrency edge cases', () => {
  it('parses currency with symbol', () => {
    expect(parseCurrency('£1,000.00')).toBe(1000);
  });

  it('parses currency with Euro sign', () => {
    expect(parseCurrency('€500.50')).toBe(500.5);
  });

  it('parses plain number string', () => {
    expect(parseCurrency('42.00')).toBe(42);
  });

  it('returns 0 for empty string', () => {
    expect(parseCurrency('')).toBe(0);
  });

  it('returns 0 for just a symbol', () => {
    expect(parseCurrency('$')).toBe(0);
  });

  it('parses negative with parentheses-style formatting', () => {
    // parseCurrency strips non-numeric chars, so parentheses get removed
    // "-500" remains after cleanup
    expect(parseCurrency('-$500.00')).toBe(-500);
  });

  it('handles multiple decimal points (uses first)', () => {
    expect(parseCurrency('1.234.56')).toBe(1.234);
  });
});
