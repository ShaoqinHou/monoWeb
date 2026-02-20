import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BillLineItems } from '../components/BillLineItems';
import type { BillLineItemFormData } from '../types';

function defaultLine(overrides: Partial<BillLineItemFormData> = {}): BillLineItemFormData {
  return {
    description: 'Test item',
    quantity: 2,
    unitPrice: 50,
    accountCode: '',
    taxRate: 15,
    discount: 0,
    ...overrides,
  };
}

describe('BillLineItems', () => {
  it('renders line item rows', () => {
    const lines = [defaultLine(), defaultLine({ description: 'Second item' })];
    render(
      <BillLineItems lineItems={lines} amountType="exclusive" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('line-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-row-1')).toBeInTheDocument();
  });

  it('displays calculated line amounts for tax exclusive', () => {
    // qty=2, price=50, tax=15% → lineAmount=100, taxAmount=15
    const lines = [defaultLine()];
    render(
      <BillLineItems lineItems={lines} amountType="exclusive" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('line-amount-0')).toHaveTextContent('100.00');
    expect(screen.getByTestId('line-tax-amount-0')).toHaveTextContent('15.00');
  });

  it('displays calculated amounts for tax inclusive', () => {
    // qty=1, price=115, tax=15%, inclusive → lineAmount=100, taxAmount=15
    const lines = [defaultLine({ quantity: 1, unitPrice: 115, taxRate: 15 })];
    render(
      <BillLineItems lineItems={lines} amountType="inclusive" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('line-amount-0')).toHaveTextContent('100.00');
    expect(screen.getByTestId('line-tax-amount-0')).toHaveTextContent('15.00');
  });

  it('displays zero tax for no_tax amount type', () => {
    const lines = [defaultLine({ quantity: 1, unitPrice: 100 })];
    render(
      <BillLineItems lineItems={lines} amountType="no_tax" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('line-tax-amount-0')).toHaveTextContent('0.00');
    expect(screen.getByTestId('line-amount-0')).toHaveTextContent('100.00');
  });

  it('displays totals section', () => {
    const lines = [defaultLine()];
    render(
      <BillLineItems lineItems={lines} amountType="exclusive" onChange={vi.fn()} />,
    );
    // subTotal=100, tax=15, total=115
    expect(screen.getByTestId('bill-subtotal')).toHaveTextContent('$100.00');
    expect(screen.getByTestId('bill-tax')).toHaveTextContent('$15.00');
    expect(screen.getByTestId('bill-total')).toHaveTextContent('$115.00');
  });

  it('shows add line button', () => {
    render(
      <BillLineItems lineItems={[defaultLine()]} amountType="exclusive" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('add-line-btn')).toBeInTheDocument();
  });

  it('calls onChange when add line is clicked', () => {
    const onChange = vi.fn();
    render(
      <BillLineItems lineItems={[defaultLine()]} amountType="exclusive" onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('add-line-btn'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const newItems = onChange.mock.calls[0][0];
    expect(newItems).toHaveLength(2);
  });

  it('calls onChange when remove line is clicked', () => {
    const onChange = vi.fn();
    const lines = [defaultLine(), defaultLine({ description: 'Second' })];
    render(
      <BillLineItems lineItems={lines} amountType="exclusive" onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('line-remove-0'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const remaining = onChange.mock.calls[0][0];
    expect(remaining).toHaveLength(1);
  });

  it('hides add and remove buttons when disabled', () => {
    render(
      <BillLineItems
        lineItems={[defaultLine()]}
        amountType="exclusive"
        onChange={vi.fn()}
        disabled={true}
      />,
    );
    expect(screen.queryByTestId('add-line-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('line-remove-0')).not.toBeInTheDocument();
  });

  it('applies discount correctly in calculations', () => {
    // qty=1, price=100, discount=10%, tax=15%, exclusive
    // lineAmount = 100 * 0.9 = 90, taxAmount = 90 * 0.15 = 13.50
    const lines = [defaultLine({ quantity: 1, unitPrice: 100, discount: 10, taxRate: 15 })];
    render(
      <BillLineItems lineItems={lines} amountType="exclusive" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('line-amount-0')).toHaveTextContent('90.00');
    expect(screen.getByTestId('line-tax-amount-0')).toHaveTextContent('13.50');
  });

  it('renders correct totals for multiple lines', () => {
    const lines = [
      defaultLine({ quantity: 1, unitPrice: 100, taxRate: 15, discount: 0 }),
      defaultLine({ quantity: 2, unitPrice: 50, taxRate: 15, discount: 0 }),
    ];
    render(
      <BillLineItems lineItems={lines} amountType="exclusive" onChange={vi.fn()} />,
    );
    // Line 1: amount=100, tax=15. Line 2: amount=100, tax=15. Total: sub=200, tax=30, total=230
    expect(screen.getByTestId('bill-subtotal')).toHaveTextContent('$200.00');
    expect(screen.getByTestId('bill-tax')).toHaveTextContent('$30.00');
    expect(screen.getByTestId('bill-total')).toHaveTextContent('$230.00');
  });
});
