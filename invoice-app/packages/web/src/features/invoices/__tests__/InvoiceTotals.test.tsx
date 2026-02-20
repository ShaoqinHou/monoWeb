import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvoiceTotals } from '../components/InvoiceTotals';
import type { FormLineItem } from '../types';

function makeLine(overrides: Partial<FormLineItem> = {}): FormLineItem {
  return {
    key: 'test-key',
    description: 'Test Item',
    quantity: 1,
    unitPrice: 100,
    accountCode: '200',
    taxRate: 15,
    discount: 0,
    discountType: 'percent',
    ...overrides,
  };
}

describe('InvoiceTotals', () => {
  it('renders the totals container', () => {
    render(<InvoiceTotals lineItems={[makeLine()]} amountType="exclusive" />);
    expect(screen.getByTestId('invoice-totals')).toBeInTheDocument();
  });

  it('calculates subtotal correctly for exclusive tax', () => {
    const lines = [makeLine({ quantity: 2, unitPrice: 500 })];
    render(<InvoiceTotals lineItems={lines} amountType="exclusive" />);
    // 2 * 500 = 1000
    expect(screen.getByTestId('totals-subtotal')).toHaveTextContent('$1,000.00');
  });

  it('calculates tax correctly for exclusive amounts', () => {
    const lines = [makeLine({ quantity: 1, unitPrice: 1000, taxRate: 15 })];
    render(<InvoiceTotals lineItems={lines} amountType="exclusive" />);
    // Tax = 1000 * 0.15 = 150
    expect(screen.getByTestId('totals-tax')).toHaveTextContent('$150.00');
  });

  it('calculates total correctly for exclusive amounts', () => {
    const lines = [makeLine({ quantity: 1, unitPrice: 1000, taxRate: 15 })];
    render(<InvoiceTotals lineItems={lines} amountType="exclusive" />);
    // Total = 1000 + 150 = 1150
    expect(screen.getByTestId('totals-total')).toHaveTextContent('$1,150.00');
  });

  it('handles multiple line items', () => {
    const lines = [
      makeLine({ quantity: 2, unitPrice: 100, taxRate: 15 }),
      makeLine({ key: 'b', quantity: 1, unitPrice: 50, taxRate: 15 }),
    ];
    render(<InvoiceTotals lineItems={lines} amountType="exclusive" />);
    // Subtotal = 200 + 50 = 250
    expect(screen.getByTestId('totals-subtotal')).toHaveTextContent('$250.00');
    // Tax = 30 + 7.5 = 37.5
    expect(screen.getByTestId('totals-tax')).toHaveTextContent('$37.50');
    // Total = 250 + 37.5 = 287.5
    expect(screen.getByTestId('totals-total')).toHaveTextContent('$287.50');
  });

  it('handles inclusive tax amounts', () => {
    const lines = [makeLine({ quantity: 1, unitPrice: 115, taxRate: 15 })];
    render(<InvoiceTotals lineItems={lines} amountType="inclusive" />);
    // Inclusive: lineAmount = 115 / 1.15 = 100, tax = 15
    expect(screen.getByTestId('totals-subtotal')).toHaveTextContent('$100.00');
    expect(screen.getByTestId('totals-tax')).toHaveTextContent('$15.00');
    expect(screen.getByTestId('totals-total')).toHaveTextContent('$115.00');
  });

  it('hides tax row when amountType is no_tax', () => {
    const lines = [makeLine({ quantity: 1, unitPrice: 100, taxRate: 0 })];
    render(<InvoiceTotals lineItems={lines} amountType="no_tax" />);
    expect(screen.queryByTestId('totals-tax')).not.toBeInTheDocument();
    expect(screen.getByTestId('totals-subtotal')).toHaveTextContent('$100.00');
    expect(screen.getByTestId('totals-total')).toHaveTextContent('$100.00');
  });

  it('shows payment and amount due when amountPaid > 0', () => {
    const lines = [makeLine({ quantity: 1, unitPrice: 1000, taxRate: 15 })];
    render(<InvoiceTotals lineItems={lines} amountType="exclusive" amountPaid={500} />);
    expect(screen.getByTestId('totals-paid')).toHaveTextContent('$500.00');
    // Amount due = 1150 - 500 = 650
    expect(screen.getByTestId('totals-amount-due')).toHaveTextContent('$650.00');
  });

  it('does not show payment section when amountPaid is 0', () => {
    const lines = [makeLine()];
    render(<InvoiceTotals lineItems={lines} amountType="exclusive" amountPaid={0} />);
    expect(screen.queryByTestId('totals-paid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('totals-amount-due')).not.toBeInTheDocument();
  });

  it('handles empty line items gracefully', () => {
    render(<InvoiceTotals lineItems={[]} amountType="exclusive" />);
    expect(screen.getByTestId('totals-subtotal')).toHaveTextContent('$0.00');
    expect(screen.getByTestId('totals-total')).toHaveTextContent('$0.00');
  });

  it('handles discount in line items', () => {
    // 1 * 200 * (1 - 10/100) = 180 subtotal, 27 tax, 207 total
    const lines = [makeLine({ quantity: 1, unitPrice: 200, taxRate: 15, discount: 10 })];
    render(<InvoiceTotals lineItems={lines} amountType="exclusive" />);
    expect(screen.getByTestId('totals-subtotal')).toHaveTextContent('$180.00');
    expect(screen.getByTestId('totals-tax')).toHaveTextContent('$27.00');
    expect(screen.getByTestId('totals-total')).toHaveTextContent('$207.00');
  });
});
