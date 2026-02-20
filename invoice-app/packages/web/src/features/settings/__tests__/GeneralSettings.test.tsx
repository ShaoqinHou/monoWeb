// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneralSettings } from '../components/GeneralSettings';
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

describe('GeneralSettings', () => {
  it('renders all form fields', () => {
    render(<GeneralSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Organisation Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Industry')).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByLabelText('GST Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Financial Year End')).toBeInTheDocument();
  });

  it('displays the current org name value', () => {
    render(<GeneralSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Organisation Name')).toHaveValue('Demo Company (NZ)');
  });

  it('displays the current industry value', () => {
    render(<GeneralSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Industry')).toHaveValue('Professional Services');
  });

  it('displays the current address value', () => {
    render(<GeneralSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Address')).toHaveValue(
      '123 Lambton Quay, Wellington 6011, New Zealand',
    );
  });

  it('displays the current GST number value', () => {
    render(<GeneralSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('GST Number')).toHaveValue('123-456-789');
  });

  it('displays the financial year end as March (3)', () => {
    render(<GeneralSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Financial Year End')).toHaveValue('3');
  });

  it('renders Save button', () => {
    render(<GeneralSettings settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByTestId('save-general')).toBeInTheDocument();
    expect(screen.getByTestId('save-general')).toHaveTextContent('Save');
  });

  it('calls onSave with updated values when Save is clicked', () => {
    const onSave = vi.fn();
    render(<GeneralSettings settings={MOCK_SETTINGS} onSave={onSave} />);

    // Change the org name
    const nameInput = screen.getByLabelText('Organisation Name');
    fireEvent.change(nameInput, { target: { value: 'Updated Company' } });

    fireEvent.click(screen.getByTestId('save-general'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Company',
        industry: 'Professional Services',
        address: '123 Lambton Quay, Wellington 6011, New Zealand',
        gstNumber: '123-456-789',
        financialYearEnd: 3,
      }),
    );
  });

  it('shows loading state on Save button when saving', () => {
    render(<GeneralSettings settings={MOCK_SETTINGS} onSave={vi.fn()} saving />);
    const button = screen.getByTestId('save-general');
    expect(button).toBeDisabled();
  });
});
