// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringBillForm } from '../components/RecurringBillForm';

// Mock @shared/calc imports used by BillLineItems -> BillLineRow -> BillTotals
vi.mock('@shared/calc/line-item-calc', () => ({
  calcLineItem: () => ({ lineAmount: 0, taxAmount: 0 }),
}));

vi.mock('@shared/calc/invoice-calc', () => ({
  calcInvoiceTotals: () => ({ subTotal: 0, totalTax: 0, total: 0 }),
}));

vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}));

const MOCK_SUPPLIERS = [
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

describe('RecurringBillForm', () => {
  it('renders the form container', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('recurring-bill-form')).toBeInTheDocument();
  });

  it('renders template name input', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('rb-template-name')).toBeInTheDocument();
  });

  it('renders supplier/contact combobox input', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    const input = screen.getByTestId('rb-contact-name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('role', 'combobox');
  });

  it('shows supplier options when combobox is opened', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    fireEvent.click(screen.getByTestId('rb-contact-name'));
    expect(screen.getByRole('option', { name: 'Supplier A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Supplier B' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Supplier C' })).toBeInTheDocument();
  });

  it('renders placeholder in supplier combobox', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByPlaceholderText('Select a supplier...')).toBeInTheDocument();
  });

  it('renders frequency dropdown', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('rb-frequency-select')).toBeInTheDocument();
  });

  it('renders frequency options', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Quarterly')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
    expect(screen.getByText('Fortnightly')).toBeInTheDocument();
    expect(screen.getByText('Bi-monthly')).toBeInTheDocument();
  });

  it('renders next bill date input', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('rb-next-date')).toBeInTheDocument();
  });

  it('renders end date input', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('rb-end-date')).toBeInTheDocument();
  });

  it('renders reference input', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('rb-reference')).toBeInTheDocument();
  });

  it('renders amount type dropdown', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('rb-amount-type-select')).toBeInTheDocument();
  });

  it('renders line items editor', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('bill-line-items')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    expect(screen.getByTestId('rb-save-btn')).toHaveTextContent('Save');
  });

  it('shows validation error when template name is empty and save clicked', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    fireEvent.click(screen.getByTestId('rb-save-btn'));
    expect(screen.getByText('Template name is required')).toBeInTheDocument();
  });

  it('shows validation error when supplier is not selected and save clicked', () => {
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={vi.fn()} />);
    // Fill template name but do not select supplier
    fireEvent.change(screen.getByTestId('rb-template-name'), { target: { value: 'Monthly Rent' } });
    fireEvent.click(screen.getByTestId('rb-save-btn'));
    expect(screen.getByText('Please select a supplier')).toBeInTheDocument();
  });

  it('calls onSave with form data when valid', () => {
    const onSave = vi.fn();
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={onSave} />);

    fireEvent.change(screen.getByTestId('rb-template-name'), { target: { value: 'Monthly Rent' } });
    selectSupplier('rb-contact-name', 'Supplier A');
    fireEvent.change(screen.getByTestId('line-description-0'), { target: { value: 'Office rent' } });
    fireEvent.change(screen.getByTestId('line-unit-price-0'), { target: { value: '2000' } });

    fireEvent.click(screen.getByTestId('rb-save-btn'));
    expect(onSave).toHaveBeenCalledTimes(1);

    const data = onSave.mock.calls[0][0];
    expect(data.templateName).toBe('Monthly Rent');
    expect(data.contactId).toBe('s1');
    expect(data.contactName).toBe('Supplier A');
    expect(data.frequency).toBe('monthly');
    expect(data.lineItems[0].description).toBe('Office rent');
    expect(data.lineItems[0].unitPrice).toBe(2000);
  });

  it('does not call onSave when line items have no content', () => {
    const onSave = vi.fn();
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={onSave} />);

    fireEvent.change(screen.getByTestId('rb-template-name'), { target: { value: 'Test' } });
    selectSupplier('rb-contact-name', 'Supplier A');
    // Default line item has empty description and 0 price
    fireEvent.click(screen.getByTestId('rb-save-btn'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('pre-fills initial data when provided', () => {
    render(
      <RecurringBillForm
        suppliers={MOCK_SUPPLIERS}
        onSave={vi.fn()}
        initialData={{
          templateName: 'Existing Template',
          contactId: 's2',
          contactName: 'Supplier B',
          frequency: 'weekly',
          nextDate: '2026-03-01',
          endDate: '2026-12-31',
          reference: 'REF-001',
        }}
      />,
    );

    expect(screen.getByTestId('rb-template-name')).toHaveValue('Existing Template');
    // Combobox shows the label of the selected option, not the raw id value
    expect(screen.getByTestId('rb-contact-name')).toHaveValue('Supplier B');
    expect(screen.getByTestId('rb-next-date')).toHaveValue('2026-03-01');
    expect(screen.getByTestId('rb-end-date')).toHaveValue('2026-12-31');
    expect(screen.getByTestId('rb-reference')).toHaveValue('REF-001');
  });

  it('allows changing frequency', () => {
    const onSave = vi.fn();
    render(<RecurringBillForm suppliers={MOCK_SUPPLIERS} onSave={onSave} />);

    fireEvent.change(screen.getByTestId('rb-template-name'), { target: { value: 'Test' } });
    selectSupplier('rb-contact-name', 'Supplier A');
    fireEvent.change(screen.getByTestId('rb-frequency-select'), { target: { value: 'quarterly' } });
    fireEvent.change(screen.getByTestId('line-description-0'), { target: { value: 'Item' } });
    fireEvent.change(screen.getByTestId('line-unit-price-0'), { target: { value: '100' } });

    fireEvent.click(screen.getByTestId('rb-save-btn'));
    expect(onSave.mock.calls[0][0].frequency).toBe('quarterly');
  });

  it('works with an empty suppliers list', () => {
    render(<RecurringBillForm suppliers={[]} onSave={vi.fn()} />);
    const input = screen.getByTestId('rb-contact-name');
    expect(input).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select a supplier...')).toBeInTheDocument();
  });
});
