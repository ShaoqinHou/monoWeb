// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringInvoiceForm } from '../components/RecurringInvoiceForm';

// Mock crypto.randomUUID for stable keys
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${uuidCounter++}`,
});

const TEST_CONTACTS = [
  { value: 'ct-1', label: 'Acme Corporation' },
  { value: 'ct-2', label: 'Bay Industries Ltd' },
  { value: 'ct-3', label: 'Creative Solutions NZ' },
];

describe('RecurringInvoiceForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    uuidCounter = 0;
    mockOnSubmit.mockClear();
  });

  it('renders the form container', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('recurring-invoice-form')).toBeInTheDocument();
  });

  it('renders the template name field', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('form-template-name')).toBeInTheDocument();
  });

  it('renders the contact selector', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('form-contact')).toBeInTheDocument();
  });

  it('renders the frequency dropdown with "monthly" as default', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    const frequency = screen.getByTestId('form-frequency');
    expect(frequency).toBeInTheDocument();
    expect(frequency).toHaveValue('monthly');
  });

  it('frequency dropdown includes all options', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    const frequency = screen.getByTestId('form-frequency');
    const options = frequency.querySelectorAll('option');
    const values = Array.from(options).map((opt) => opt.value);
    expect(values).toContain('weekly');
    expect(values).toContain('fortnightly');
    expect(values).toContain('monthly');
    expect(values).toContain('bimonthly');
    expect(values).toContain('quarterly');
    expect(values).toContain('yearly');
  });

  it('renders the next date field', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('form-next-date')).toBeInTheDocument();
  });

  it('renders the end date field', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('form-end-date')).toBeInTheDocument();
  });

  it('renders the days until due field', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    const daysField = screen.getByTestId('form-days-until-due');
    expect(daysField).toBeInTheDocument();
    expect(daysField).toHaveValue(30);
  });

  it('renders the reference field', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('form-reference')).toBeInTheDocument();
  });

  it('renders the line items section', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('recurring-line-items')).toBeInTheDocument();
  });

  it('starts with one empty line item', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('recurring-line-row-0')).toBeInTheDocument();
    expect(screen.queryByTestId('recurring-line-row-1')).not.toBeInTheDocument();
  });

  it('can add a line item', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByTestId('add-line-button'));
    expect(screen.getByTestId('recurring-line-row-1')).toBeInTheDocument();
  });

  it('can remove a line item', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    // Add a second line
    fireEvent.click(screen.getByTestId('add-line-button'));
    expect(screen.getByTestId('recurring-line-row-1')).toBeInTheDocument();
    // Remove the first line
    fireEvent.click(screen.getByTestId('remove-line-0'));
    expect(screen.queryByTestId('recurring-line-row-1')).not.toBeInTheDocument();
  });

  it('renders the totals section', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('recurring-totals')).toBeInTheDocument();
  });

  it('renders Save button', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('save-recurring-button')).toBeInTheDocument();
  });

  it('Save button is disabled when template name and contact are empty', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    expect(screen.getByTestId('save-recurring-button')).toBeDisabled();
  });

  it('pre-fills form with initial data', () => {
    render(
      <RecurringInvoiceForm
        contacts={TEST_CONTACTS}
        onSubmit={mockOnSubmit}
        initialData={{
          templateName: 'Monthly Services',
          contactId: 'ct-2',
          frequency: 'quarterly',
          nextDate: '2024-03-01',
          endDate: '2024-12-31',
          daysUntilDue: 14,
          reference: 'REF-001',
          lineItems: [
            {
              key: 'li-1',
              description: 'Consulting',
              quantity: 10,
              unitPrice: 200,
              taxRate: 15,
              discount: 0,
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('form-template-name')).toHaveValue('Monthly Services');
    // Combobox shows the label (not value) in the input when pre-filled
    expect(screen.getByTestId('form-contact')).toHaveValue('Bay Industries Ltd');
    expect(screen.getByTestId('form-frequency')).toHaveValue('quarterly');
    expect(screen.getByTestId('form-next-date')).toHaveValue('2024-03-01');
    expect(screen.getByTestId('form-end-date')).toHaveValue('2024-12-31');
    expect(screen.getByTestId('form-days-until-due')).toHaveValue(14);
    expect(screen.getByTestId('form-reference')).toHaveValue('REF-001');
  });

  it('computes totals correctly for line items', () => {
    render(
      <RecurringInvoiceForm
        contacts={TEST_CONTACTS}
        onSubmit={mockOnSubmit}
        initialData={{
          templateName: 'Test',
          contactId: 'ct-1',
          frequency: 'monthly',
          nextDate: '2024-01-01',
          endDate: '',
          daysUntilDue: 30,
          reference: '',
          lineItems: [
            {
              key: 'li-1',
              description: 'Service',
              quantity: 2,
              unitPrice: 100,
              taxRate: 15,
              discount: 0,
            },
          ],
        }}
      />,
    );

    // subtotal = 2 * 100 = 200, tax = 200 * 0.15 = 30, total = 230
    expect(screen.getByTestId('totals-subtotal')).toHaveTextContent('200.00');
    expect(screen.getByTestId('totals-tax')).toHaveTextContent('30.00');
    expect(screen.getByTestId('totals-total')).toHaveTextContent('230.00');
  });

  it('calls onSubmit with form data when Save is clicked', () => {
    render(
      <RecurringInvoiceForm
        contacts={TEST_CONTACTS}
        onSubmit={mockOnSubmit}
        initialData={{
          templateName: 'Monthly Retainer',
          contactId: 'ct-1',
          frequency: 'monthly',
          nextDate: '2024-01-01',
          endDate: '',
          daysUntilDue: 30,
          reference: 'REF-X',
          lineItems: [
            {
              key: 'li-1',
              description: 'Dev Work',
              quantity: 1,
              unitPrice: 5000,
              taxRate: 15,
              discount: 0,
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByTestId('save-recurring-button'));
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    const callData = mockOnSubmit.mock.calls[0][0];
    expect(callData.templateName).toBe('Monthly Retainer');
    expect(callData.contactId).toBe('ct-1');
    expect(callData.frequency).toBe('monthly');
    expect(callData.reference).toBe('REF-X');
  });

  it('shows loading state on Save button when isSaving is true', () => {
    render(
      <RecurringInvoiceForm
        contacts={TEST_CONTACTS}
        onSubmit={mockOnSubmit}
        isSaving={true}
        initialData={{
          templateName: 'Test',
          contactId: 'ct-1',
        }}
      />,
    );
    expect(screen.getByTestId('save-recurring-button')).toBeDisabled();
  });

  it('can change frequency via the dropdown', () => {
    render(<RecurringInvoiceForm contacts={TEST_CONTACTS} onSubmit={mockOnSubmit} />);
    const frequency = screen.getByTestId('form-frequency');
    fireEvent.change(frequency, { target: { value: 'weekly' } });
    expect(frequency).toHaveValue('weekly');
  });
});
