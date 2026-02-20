import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceLineItems, createEmptyLine } from '../components/InvoiceLineItems';
import type { FormLineItem } from '../types';

function makeLine(overrides: Partial<FormLineItem> = {}): FormLineItem {
  return {
    key: 'line-1',
    description: 'Test Service',
    quantity: 2,
    unitPrice: 100,
    accountCode: '200',
    taxRate: 15,
    discount: 0,
    discountType: 'percent',
    ...overrides,
  };
}

describe('InvoiceLineItems', () => {
  it('renders the line items container', () => {
    render(
      <InvoiceLineItems
        lineItems={[makeLine()]}
        amountType="exclusive"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('invoice-line-items')).toBeInTheDocument();
  });

  it('renders a line item row for each item', () => {
    const lines = [
      makeLine({ key: 'a' }),
      makeLine({ key: 'b', description: 'Another Service' }),
    ];
    render(
      <InvoiceLineItems lineItems={lines} amountType="exclusive" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('line-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-row-1')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(
      <InvoiceLineItems lineItems={[makeLine()]} amountType="exclusive" onChange={vi.fn()} />,
    );
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Qty.')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Tax rate')).toBeInTheDocument();
    expect(screen.getByText('Amount NZD')).toBeInTheDocument();
  });

  it('renders the "Add row" button', () => {
    render(
      <InvoiceLineItems lineItems={[makeLine()]} amountType="exclusive" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('add-line-button')).toBeInTheDocument();
    expect(screen.getByText('Add row')).toBeInTheDocument();
  });

  it('calls onChange with a new line when "Add row" is clicked', () => {
    const onChange = vi.fn();
    const lines = [makeLine()];
    render(
      <InvoiceLineItems lineItems={lines} amountType="exclusive" onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('add-line-button'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const newLines = onChange.mock.calls[0][0] as FormLineItem[];
    expect(newLines).toHaveLength(2);
    expect(newLines[0]).toEqual(lines[0]);
    // New line should have empty description
    expect(newLines[1].description).toBe('');
    expect(newLines[1].quantity).toBe(1);
    expect(newLines[1].unitPrice).toBe(0);
  });

  it('calls onChange when removing a line item', () => {
    const onChange = vi.fn();
    const lines = [
      makeLine({ key: 'a', description: 'First' }),
      makeLine({ key: 'b', description: 'Second' }),
    ];
    render(
      <InvoiceLineItems lineItems={lines} amountType="exclusive" onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('line-remove-0'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const newLines = onChange.mock.calls[0][0] as FormLineItem[];
    expect(newLines).toHaveLength(1);
    expect(newLines[0].description).toBe('Second');
  });

  it('does not show remove button when only 1 line item', () => {
    render(
      <InvoiceLineItems lineItems={[makeLine()]} amountType="exclusive" onChange={vi.fn()} />,
    );
    expect(screen.queryByTestId('line-remove-0')).not.toBeInTheDocument();
  });

  it('shows remove buttons when multiple lines exist', () => {
    const lines = [makeLine({ key: 'a' }), makeLine({ key: 'b' })];
    render(
      <InvoiceLineItems lineItems={lines} amountType="exclusive" onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('line-remove-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-remove-1')).toBeInTheDocument();
  });

  it('calls onChange when a field value changes', () => {
    const onChange = vi.fn();
    render(
      <InvoiceLineItems lineItems={[makeLine()]} amountType="exclusive" onChange={onChange} />,
    );
    // data-testid goes directly on the <input> element via spread props
    const descInput = screen.getByTestId('line-description-0');
    expect(descInput).toBeInTheDocument();
    fireEvent.change(descInput, { target: { value: 'Updated' } });
    expect(onChange).toHaveBeenCalled();
    const updatedLines = onChange.mock.calls[0][0] as FormLineItem[];
    expect(updatedLines[0].description).toBe('Updated');
  });

  it('displays calculated amounts per line', () => {
    // qty=2, price=100, tax=15% exclusive → line=200, tax=30, total=230
    render(
      <InvoiceLineItems
        lineItems={[makeLine({ quantity: 2, unitPrice: 100, taxRate: 15 })]}
        amountType="exclusive"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId('line-amount-0')).toHaveTextContent('$230.00');
  });

  it('createEmptyLine returns a valid empty line', () => {
    const line = createEmptyLine();
    expect(line.description).toBe('');
    expect(line.quantity).toBe(1);
    expect(line.unitPrice).toBe(0);
    expect(line.taxRate).toBe(15);
    expect(line.discount).toBe(0);
    expect(line.key).toEqual(expect.any(String));
  });

  it('shows "Create new" in region combobox when onCreateNewRegion is provided', () => {
    const onCreateNewRegion = vi.fn();
    const regionOptions = [{ value: 'north', label: 'North' }];
    render(
      <InvoiceLineItems
        lineItems={[makeLine()]}
        amountType="exclusive"
        onChange={vi.fn()}
        regionOptions={regionOptions}
        onCreateNewRegion={onCreateNewRegion}
      />,
    );
    fireEvent.click(screen.getByTestId('line-region-0'));
    expect(screen.getByText('Create new')).toBeInTheDocument();
  });

  it('calls onCreateNewRegion when "Create new" is clicked in region dropdown', () => {
    const onCreateNewRegion = vi.fn();
    const regionOptions = [{ value: 'north', label: 'North' }];
    render(
      <InvoiceLineItems
        lineItems={[makeLine()]}
        amountType="exclusive"
        onChange={vi.fn()}
        regionOptions={regionOptions}
        onCreateNewRegion={onCreateNewRegion}
      />,
    );
    fireEvent.click(screen.getByTestId('line-region-0'));
    fireEvent.click(screen.getByText('Create new'));
    expect(onCreateNewRegion).toHaveBeenCalledTimes(1);
  });
});
