// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceSettings } from '../components/InvoiceSettings';
import type { OrganizationSettings } from '../types';

const MOCK_SETTINGS: OrganizationSettings = {
  name: 'Demo Company (NZ)',
  industry: 'Professional Services',
  address: '123 Lambton Quay, Wellington 6011, New Zealand',
  gstNumber: '123-456-789',
  financialYearEnd: 3,
  defaultPaymentTerms: 30,
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 1042,
  billPrefix: 'BILL-',
  nextBillNumber: 587,
  defaultTaxRate: 15,
  gstFilingFrequency: 'bi-monthly',
  baseCurrency: 'NZD',
  taxRegistration: 'GST',
  lockDate: '',
  defaultSalesAccount: '200 - Sales',
  defaultPurchasesAccount: '400 - Purchases',
};

describe('InvoiceSettings', () => {
  it('renders all form fields', () => {
    render(<InvoiceSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Default Payment Terms')).toBeInTheDocument();
    expect(screen.getByLabelText('Invoice Prefix')).toBeInTheDocument();
    expect(screen.getByLabelText('Next Invoice Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Bill Prefix')).toBeInTheDocument();
    expect(screen.getByLabelText('Next Bill Number')).toBeInTheDocument();
  });

  it('displays the current payment terms value (Net 30)', () => {
    render(<InvoiceSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Default Payment Terms')).toHaveValue('30');
  });

  it('displays the current invoice prefix', () => {
    render(<InvoiceSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Invoice Prefix')).toHaveValue('INV-');
  });

  it('displays the next invoice number', () => {
    render(<InvoiceSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Next Invoice Number')).toHaveValue(1042);
  });

  it('displays the current bill prefix', () => {
    render(<InvoiceSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Bill Prefix')).toHaveValue('BILL-');
  });

  it('displays the next bill number', () => {
    render(<InvoiceSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Next Bill Number')).toHaveValue(587);
  });

  it('renders Save button', () => {
    render(<InvoiceSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByTestId('save-invoice')).toBeInTheDocument();
    expect(screen.getByTestId('save-invoice')).toHaveTextContent('Save');
  });

  it('calls onSave with updated values when Save is clicked', () => {
    const onSave = vi.fn();
    render(<InvoiceSettings settings={MOCK_SETTINGS} onSave={onSave} />);

    const prefixInput = screen.getByLabelText('Invoice Prefix');
    fireEvent.change(prefixInput, { target: { value: 'SI-' } });

    fireEvent.click(screen.getByTestId('save-invoice'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        invoicePrefix: 'SI-',
        defaultPaymentTerms: 30,
        nextInvoiceNumber: 1042,
        billPrefix: 'BILL-',
        nextBillNumber: 587,
      }),
    );
  });

  it('payment terms dropdown has all expected options', () => {
    render(<InvoiceSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    const select = screen.getByLabelText('Default Payment Terms');
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(5);
    expect(options[0]).toHaveTextContent('Due on Receipt');
    expect(options[1]).toHaveTextContent('Net 7');
    expect(options[2]).toHaveTextContent('Net 15');
    expect(options[3]).toHaveTextContent('Net 30');
    expect(options[4]).toHaveTextContent('Net 60');
  });

  it('shows loading state on Save button when saving', () => {
    render(<InvoiceSettings settings={MOCK_SETTINGS} onSave={vi.fn()} saving />);
    const button = screen.getByTestId('save-invoice');
    expect(button).toBeDisabled();
  });
});
