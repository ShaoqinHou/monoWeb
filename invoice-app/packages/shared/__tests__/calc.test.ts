import { describe, it, expect } from 'vitest';
import { calcLineItem, round2 } from '../calc/line-item-calc';
import { calcInvoiceTotals, calcAmountDue } from '../calc/invoice-calc';
import { formatCurrency, parseCurrency } from '../calc/currency';

describe('round2', () => {
  it('rounds to 2 decimal places', () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.235)).toBe(1.24);
    expect(round2(1.005)).toBe(1.01);
    expect(round2(0)).toBe(0);
    expect(round2(-1.234)).toBe(-1.23);
  });
});

describe('calcLineItem', () => {
  describe('tax exclusive', () => {
    it('calculates basic line item', () => {
      const result = calcLineItem(
        { quantity: 2, unitPrice: 100, discount: 0, taxRate: 15 },
        'exclusive',
      );
      expect(result.lineAmount).toBe(200);
      expect(result.taxAmount).toBe(30);
    });

    it('applies discount before tax', () => {
      const result = calcLineItem(
        { quantity: 1, unitPrice: 100, discount: 10, taxRate: 15 },
        'exclusive',
      );
      expect(result.lineAmount).toBe(90);
      expect(result.taxAmount).toBe(13.5);
    });

    it('handles zero quantity', () => {
      const result = calcLineItem(
        { quantity: 0, unitPrice: 100, discount: 0, taxRate: 15 },
        'exclusive',
      );
      expect(result.lineAmount).toBe(0);
      expect(result.taxAmount).toBe(0);
    });

    it('handles zero tax rate', () => {
      const result = calcLineItem(
        { quantity: 5, unitPrice: 20, discount: 0, taxRate: 0 },
        'exclusive',
      );
      expect(result.lineAmount).toBe(100);
      expect(result.taxAmount).toBe(0);
    });
  });

  describe('tax inclusive', () => {
    it('extracts tax from inclusive amount', () => {
      // 115 inclusive at 15% → lineAmount = 100, tax = 15
      const result = calcLineItem(
        { quantity: 1, unitPrice: 115, discount: 0, taxRate: 15 },
        'inclusive',
      );
      expect(result.lineAmount).toBe(100);
      expect(result.taxAmount).toBe(15);
    });

    it('applies discount to inclusive amount', () => {
      // 115 × 0.9 = 103.50 inclusive → 90 + 13.50
      const result = calcLineItem(
        { quantity: 1, unitPrice: 115, discount: 10, taxRate: 15 },
        'inclusive',
      );
      expect(result.lineAmount).toBe(90);
      expect(result.taxAmount).toBe(13.5);
    });
  });

  describe('no tax', () => {
    it('returns zero tax regardless of rate', () => {
      const result = calcLineItem(
        { quantity: 2, unitPrice: 100, discount: 0, taxRate: 15 },
        'no_tax',
      );
      expect(result.lineAmount).toBe(200);
      expect(result.taxAmount).toBe(0);
    });
  });
});

describe('calcInvoiceTotals', () => {
  it('sums multiple line items (exclusive)', () => {
    const items = [
      { quantity: 2, unitPrice: 100, discount: 0, taxRate: 15 },
      { quantity: 1, unitPrice: 50, discount: 0, taxRate: 15 },
    ];
    const totals = calcInvoiceTotals(items, 'exclusive');
    expect(totals.subTotal).toBe(250);
    expect(totals.totalTax).toBe(37.5);
    expect(totals.total).toBe(287.5);
  });

  it('handles empty line items', () => {
    const totals = calcInvoiceTotals([], 'exclusive');
    expect(totals.subTotal).toBe(0);
    expect(totals.totalTax).toBe(0);
    expect(totals.total).toBe(0);
  });

  it('handles mixed tax rates', () => {
    const items = [
      { quantity: 1, unitPrice: 100, discount: 0, taxRate: 15 },
      { quantity: 1, unitPrice: 100, discount: 0, taxRate: 0 },
    ];
    const totals = calcInvoiceTotals(items, 'exclusive');
    expect(totals.subTotal).toBe(200);
    expect(totals.totalTax).toBe(15);
    expect(totals.total).toBe(215);
  });

  it('calculates inclusive totals', () => {
    const items = [
      { quantity: 1, unitPrice: 115, discount: 0, taxRate: 15 },
    ];
    const totals = calcInvoiceTotals(items, 'inclusive');
    expect(totals.subTotal).toBe(100);
    expect(totals.totalTax).toBe(15);
    expect(totals.total).toBe(115);
  });
});

describe('calcAmountDue', () => {
  it('calculates remaining amount', () => {
    expect(calcAmountDue(287.5, 100)).toBe(187.5);
  });

  it('returns 0 when fully paid', () => {
    expect(calcAmountDue(100, 100)).toBe(0);
  });

  it('handles overpayment (negative)', () => {
    expect(calcAmountDue(100, 150)).toBe(-50);
  });
});

describe('formatCurrency', () => {
  it('formats NZD', () => {
    expect(formatCurrency(1234.5, 'NZD')).toBe('$1,234.50');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-500, 'NZD')).toBe('-$500.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0, 'NZD')).toBe('$0.00');
  });

  it('formats GBP', () => {
    expect(formatCurrency(1000, 'GBP')).toBe('£1,000.00');
  });

  it('formats EUR', () => {
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00');
  });

  it('defaults to NZD', () => {
    expect(formatCurrency(42)).toBe('$42.00');
  });
});

describe('parseCurrency', () => {
  it('parses formatted string', () => {
    expect(parseCurrency('$1,234.50')).toBe(1234.5);
  });

  it('parses negative', () => {
    expect(parseCurrency('-$500.00')).toBe(-500);
  });

  it('returns 0 for invalid input', () => {
    expect(parseCurrency('abc')).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(parseCurrency('')).toBe(0);
  });

  it('parses amount with pound symbol', () => {
    expect(parseCurrency('£2,500.00')).toBe(2500);
  });

  it('parses amount with euro symbol', () => {
    expect(parseCurrency('€1,000.50')).toBe(1000.50);
  });
});

// ── Calc edge cases ────────────────────────────────────────────────────

describe('calcLineItem edge cases', () => {
  it('handles 100% discount', () => {
    const result = calcLineItem(
      { quantity: 5, unitPrice: 200, discount: 100, taxRate: 15 },
      'exclusive',
    );
    expect(result.lineAmount).toBe(0);
    expect(result.taxAmount).toBe(0);
  });

  it('handles fractional quantities', () => {
    const result = calcLineItem(
      { quantity: 0.5, unitPrice: 100, discount: 0, taxRate: 15 },
      'exclusive',
    );
    expect(result.lineAmount).toBe(50);
    expect(result.taxAmount).toBe(7.5);
  });

  it('handles very large amounts without precision loss', () => {
    const result = calcLineItem(
      { quantity: 1, unitPrice: 999999.99, discount: 0, taxRate: 15 },
      'exclusive',
    );
    expect(result.lineAmount).toBe(999999.99);
    expect(result.taxAmount).toBe(150000);
  });

  it('handles penny rounding consistently', () => {
    // 1.01 * 3 = 3.03, tax = 0.4545 → rounds to 0.45
    const result = calcLineItem(
      { quantity: 3, unitPrice: 1.01, discount: 0, taxRate: 15 },
      'exclusive',
    );
    expect(result.lineAmount).toBe(3.03);
    expect(result.taxAmount).toBe(0.45);
  });

  it('inclusive: tax extracted correctly from odd amounts', () => {
    // $10 inclusive at 15% → lineAmount = 10/1.15 = 8.695... ≈ 8.70, tax ≈ 1.30
    const result = calcLineItem(
      { quantity: 1, unitPrice: 10, discount: 0, taxRate: 15 },
      'inclusive',
    );
    expect(result.lineAmount + result.taxAmount).toBeCloseTo(10, 2);
  });
});

describe('calcInvoiceTotals edge cases', () => {
  it('handles many line items with rounding', () => {
    // 10 items at $1.01 each, 15% tax
    const items = Array.from({ length: 10 }, () => ({
      quantity: 1,
      unitPrice: 1.01,
      discount: 0,
      taxRate: 15,
    }));
    const totals = calcInvoiceTotals(items, 'exclusive');
    expect(totals.subTotal).toBe(10.1);
    expect(totals.total).toBe(totals.subTotal + totals.totalTax);
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

  it('handles single line item', () => {
    const totals = calcInvoiceTotals(
      [{ quantity: 1, unitPrice: 100, discount: 0, taxRate: 15 }],
      'exclusive',
    );
    expect(totals.subTotal).toBe(100);
    expect(totals.totalTax).toBe(15);
    expect(totals.total).toBe(115);
  });
});

describe('round2 edge cases', () => {
  it('handles very small numbers', () => {
    expect(round2(0.001)).toBe(0);
    expect(round2(0.005)).toBe(0.01);
    expect(round2(0.004)).toBe(0);
  });

  it('handles large negative numbers', () => {
    expect(round2(-99999.999)).toBe(-100000);
  });
});
