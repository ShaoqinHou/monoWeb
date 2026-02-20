import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BillForm } from '../components/BillForm';

const SUPPLIERS = [
  { id: 's1', name: 'Supplier A' },
  { id: 's2', name: 'Supplier B' },
  { id: 's3', name: 'Supplier C' },
];

/** Helper: open the supplier combobox and click an option by label */
function selectSupplier(testId: string, label: string) {
  const input = screen.getByTestId(testId);
  fireEvent.click(input);
  const option = screen.getByRole('option', { name: label });
  fireEvent.click(option);
}

describe('BillForm', () => {
  it('renders the form container', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('bill-form')).toBeInTheDocument();
  });

  it('renders supplier combobox input', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    const input = screen.getByTestId('bill-supplier-select');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('role', 'combobox');
  });

  it('shows supplier options when combobox is opened', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    fireEvent.click(screen.getByTestId('bill-supplier-select'));
    expect(screen.getByRole('option', { name: 'Supplier A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Supplier B' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Supplier C' })).toBeInTheDocument();
  });

  it('renders reference input', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('bill-reference-input')).toBeInTheDocument();
  });

  it('renders date and due date inputs', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('bill-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('bill-due-date-input')).toBeInTheDocument();
  });

  it('renders amount type dropdown', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('bill-amount-type-select')).toBeInTheDocument();
  });

  it('renders line items editor', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('bill-line-items')).toBeInTheDocument();
  });

  it('renders Save as Draft button', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('save-draft-btn')).toHaveTextContent('Save as Draft');
  });

  it('renders Submit button', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('submit-bill-btn')).toHaveTextContent('Submit');
  });

  it('shows validation error when no supplier selected and save clicked', () => {
    render(<BillForm suppliers={SUPPLIERS} onSave={vi.fn()} />);
    fireEvent.click(screen.getByTestId('save-draft-btn'));
    expect(screen.getByText('Please select a supplier')).toBeInTheDocument();
  });

  it('calls onSave with draft action when Save as Draft clicked with valid data', () => {
    const onSave = vi.fn();
    render(<BillForm suppliers={SUPPLIERS} onSave={onSave} />);

    selectSupplier('bill-supplier-select', 'Supplier A');

    // Fill in a line item description so validation passes
    const descInput = screen.getByTestId('line-description-0');
    fireEvent.change(descInput, { target: { value: 'Office supplies' } });

    const priceInput = screen.getByTestId('line-unit-price-0');
    fireEvent.change(priceInput, { target: { value: '100' } });

    fireEvent.click(screen.getByTestId('save-draft-btn'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][1]).toBe('draft');
  });

  it('calls onSave with submit action when Submit clicked with valid data', () => {
    const onSave = vi.fn();
    render(<BillForm suppliers={SUPPLIERS} onSave={onSave} />);

    selectSupplier('bill-supplier-select', 'Supplier B');

    const descInput = screen.getByTestId('line-description-0');
    fireEvent.change(descInput, { target: { value: 'Cloud hosting' } });

    const priceInput = screen.getByTestId('line-unit-price-0');
    fireEvent.change(priceInput, { target: { value: '200' } });

    fireEvent.click(screen.getByTestId('submit-bill-btn'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][1]).toBe('submit');
  });

  it('passes line items data in onSave', () => {
    const onSave = vi.fn();
    render(<BillForm suppliers={SUPPLIERS} onSave={onSave} />);

    selectSupplier('bill-supplier-select', 'Supplier A');
    fireEvent.change(screen.getByTestId('line-description-0'), { target: { value: 'Widget' } });
    fireEvent.change(screen.getByTestId('line-quantity-0'), { target: { value: '3' } });
    fireEvent.change(screen.getByTestId('line-unit-price-0'), { target: { value: '25' } });

    fireEvent.click(screen.getByTestId('save-draft-btn'));

    const data = onSave.mock.calls[0][0];
    expect(data.lineItems[0].description).toBe('Widget');
    expect(data.lineItems[0].quantity).toBe(3);
    expect(data.lineItems[0].unitPrice).toBe(25);
  });

  it('does not call onSave when line items are empty of content', () => {
    const onSave = vi.fn();
    render(<BillForm suppliers={SUPPLIERS} onSave={onSave} />);

    selectSupplier('bill-supplier-select', 'Supplier A');
    // Default line item has empty description and 0 price — should fail validation
    fireEvent.click(screen.getByTestId('save-draft-btn'));
    expect(onSave).not.toHaveBeenCalled();
  });
});
