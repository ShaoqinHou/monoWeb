// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FinancialSettings } from '../components/FinancialSettings';
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

describe('FinancialSettings', () => {
  it('renders all form fields', () => {
    render(<FinancialSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Financial Year End')).toBeInTheDocument();
    expect(screen.getByLabelText('Base Currency')).toBeInTheDocument();
    expect(screen.getByLabelText('Tax Registration')).toBeInTheDocument();
    expect(screen.getByLabelText('Lock Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Sales Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Purchases Account')).toBeInTheDocument();
  });

  it('displays the current financial year end as March (3)', () => {
    render(<FinancialSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Financial Year End')).toHaveValue('3');
  });

  it('displays the current base currency as NZD', () => {
    render(<FinancialSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Base Currency')).toHaveValue('NZD');
  });

  it('displays the current tax registration', () => {
    render(<FinancialSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Tax Registration')).toHaveValue('GST');
  });

  it('displays default sales account', () => {
    render(<FinancialSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Default Sales Account')).toHaveValue('200 - Sales');
  });

  it('displays default purchases account', () => {
    render(<FinancialSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Default Purchases Account')).toHaveValue('400 - Purchases');
  });

  it('renders Save button', () => {
    render(<FinancialSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByTestId('save-financial')).toBeInTheDocument();
    expect(screen.getByTestId('save-financial')).toHaveTextContent('Save');
  });

  it('calls onSave with updated values when Save is clicked', () => {
    const onSave = vi.fn();
    render(<FinancialSettings settings={MOCK_SETTINGS} onSave={onSave} />);

    // Change the base currency
    fireEvent.change(screen.getByLabelText('Base Currency'), { target: { value: 'USD' } });
    // Change default sales account
    fireEvent.change(screen.getByLabelText('Default Sales Account'), { target: { value: '300 - Revenue' } });

    fireEvent.click(screen.getByTestId('save-financial'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        baseCurrency: 'USD',
        defaultSalesAccount: '300 - Revenue',
        financialYearEnd: 3,
        taxRegistration: 'GST',
        lockDate: '',
        defaultPurchasesAccount: '400 - Purchases',
      }),
    );
  });

  it('shows loading state on Save button when saving', () => {
    render(<FinancialSettings settings={MOCK_SETTINGS} onSave={vi.fn()} saving />);
    const button = screen.getByTestId('save-financial');
    expect(button).toBeDisabled();
  });
});
