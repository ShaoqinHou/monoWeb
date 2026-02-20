// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceForm } from '../components/InvoiceForm';

const TEST_CONTACTS = [
  { value: 'ct-1', label: 'Acme Corporation' },
  { value: 'ct-2', label: 'Bay Industries Ltd' },
  { value: 'ct-3', label: 'Creative Solutions NZ' },
];

describe('InvoiceForm', () => {
  const defaultProps = {
    contacts: TEST_CONTACTS,
    onSaveDraft: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders the form container', () => {
    render(<InvoiceForm {...defaultProps} />);
    expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
  });

  it('renders the contact selector', () => {
    render(<InvoiceForm {...defaultProps} />);
    const comboboxEl = screen.getByTestId('form-contact');
    expect(comboboxEl).toBeInTheDocument();
    expect(comboboxEl).toHaveAttribute('role', 'combobox');
  });

  it('renders the invoice number field as disabled', () => {
    render(<InvoiceForm {...defaultProps} />);
    // data-testid goes directly onto the <input> element via spread props
    const numberInput = screen.getByTestId('form-invoice-number');
    expect(numberInput).toBeDisabled();
  });

  it('renders date, due date, and reference fields', () => {
    render(<InvoiceForm {...defaultProps} />);
    expect(screen.getByTestId('form-date')).toBeInTheDocument();
    expect(screen.getByTestId('form-due-date')).toBeInTheDocument();
    expect(screen.getByTestId('form-reference')).toBeInTheDocument();
  });

  it('renders the amount type selector', () => {
    render(<InvoiceForm {...defaultProps} />);
    expect(screen.getByTestId('form-amount-type')).toBeInTheDocument();
  });

  it('renders the line items section', () => {
    render(<InvoiceForm {...defaultProps} />);
    expect(screen.getByTestId('invoice-line-items')).toBeInTheDocument();
  });

  it('renders the totals section', () => {
    render(<InvoiceForm {...defaultProps} />);
    expect(screen.getByTestId('invoice-totals')).toBeInTheDocument();
  });

  it('renders the notes textarea', () => {
    render(<InvoiceForm {...defaultProps} />);
    expect(screen.getByTestId('form-notes')).toBeInTheDocument();
  });

  it('renders Save as Draft and Submit buttons', () => {
    render(<InvoiceForm {...defaultProps} />);
    expect(screen.getByTestId('save-draft-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByText('Save as Draft')).toBeInTheDocument();
    expect(screen.getByText('Submit for Approval')).toBeInTheDocument();
  });

  it('disables Save/Submit when no contact is selected', () => {
    render(<InvoiceForm {...defaultProps} />);
    expect(screen.getByTestId('save-draft-button')).toBeDisabled();
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });

  it('enables Save/Submit when a contact is selected and line item has content', () => {
    render(<InvoiceForm {...defaultProps} />);
    fireEvent.click(screen.getByTestId('form-contact'));
    fireEvent.click(screen.getByText('Acme Corporation'));
    // Add a line item description so validation passes
    fireEvent.change(screen.getByTestId('line-description-0'), {
      target: { value: 'Test item' },
    });
    expect(screen.getByTestId('save-draft-button')).not.toBeDisabled();
    expect(screen.getByTestId('submit-button')).not.toBeDisabled();
  });

  it('calls onSaveDraft with form data when Save as Draft is clicked', () => {
    const onSaveDraft = vi.fn();
    render(<InvoiceForm contacts={TEST_CONTACTS} onSaveDraft={onSaveDraft} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByTestId('form-contact'));
    fireEvent.click(screen.getByText('Acme Corporation'));
    // Add a line item description so validation passes
    fireEvent.change(screen.getByTestId('line-description-0'), {
      target: { value: 'Test item' },
    });
    fireEvent.click(screen.getByTestId('save-draft-button'));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    const data = onSaveDraft.mock.calls[0][0];
    expect(data.contactId).toBe('ct-1');
    expect(data.contactName).toBe('Acme Corporation');
    expect(data.lineItems).toHaveLength(1);
  });

  it('calls onSubmit with form data when Submit for Approval is clicked', () => {
    const onSubmit = vi.fn();
    render(<InvoiceForm contacts={TEST_CONTACTS} onSaveDraft={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId('form-contact'));
    fireEvent.click(screen.getByText('Bay Industries Ltd'));
    // Add a line item description so validation passes
    fireEvent.change(screen.getByTestId('line-description-0'), {
      target: { value: 'Test item' },
    });
    fireEvent.click(screen.getByTestId('submit-button'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const data = onSubmit.mock.calls[0][0];
    expect(data.contactId).toBe('ct-2');
  });

  it('disables buttons when isSaving is true', () => {
    render(<InvoiceForm {...defaultProps} isSaving={true} />);
    expect(screen.getByTestId('save-draft-button')).toBeDisabled();
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });

  it('renders with initial data when provided', () => {
    render(
      <InvoiceForm
        {...defaultProps}
        initialData={{
          contactId: 'ct-1',
          reference: 'PO-123',
        }}
      />,
    );
    // data-testid goes directly on the <input> element
    const refInput = screen.getByTestId('form-reference');
    expect(refInput).toHaveValue('PO-123');
  });

  it('updates notes field when typed into', () => {
    render(<InvoiceForm {...defaultProps} />);
    const textarea = screen.getByTestId('form-notes');
    fireEvent.change(textarea, { target: { value: 'Payment due on receipt' } });
    expect(textarea).toHaveValue('Payment due on receipt');
  });

  it('has at least one line item by default', () => {
    render(<InvoiceForm {...defaultProps} />);
    expect(screen.getByTestId('line-row-0')).toBeInTheDocument();
  });

  it('can add additional line items', () => {
    render(<InvoiceForm {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-line-button'));
    expect(screen.getByTestId('line-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('line-row-1')).toBeInTheDocument();
  });

  it('shows "Create new" option in contact combobox dropdown', () => {
    render(<InvoiceForm {...defaultProps} />);
    fireEvent.click(screen.getByTestId('form-contact'));
    expect(screen.getByText('Create new')).toBeInTheDocument();
  });

  it('calls onCreateNewContact when "Create new" is clicked in contact dropdown', () => {
    const onCreateNewContact = vi.fn();
    render(<InvoiceForm {...defaultProps} onCreateNewContact={onCreateNewContact} />);
    fireEvent.click(screen.getByTestId('form-contact'));
    fireEvent.click(screen.getByText('Create new'));
    expect(onCreateNewContact).toHaveBeenCalledTimes(1);
  });
});
