// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsForm } from '../components/SettingsForm';

const MOCK_SETTINGS: Record<string, string> = {
  org_name: 'Acme Corp',
  country: 'NZ',
  tax_id: '123-456-789',
  industry: 'Professional Services',
  base_currency: 'NZD',
  financial_year_end: '3',
  default_payment_terms: '30',
  contact_email: 'info@acme.co.nz',
  contact_phone: '+64 21 123 4567',
};

describe('SettingsForm', () => {
  it('renders all setting fields', () => {
    render(<SettingsForm settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Organisation Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
    expect(screen.getByLabelText('Tax ID / GST Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Industry')).toBeInTheDocument();
    expect(screen.getByLabelText('Base Currency')).toBeInTheDocument();
    expect(screen.getByLabelText('Financial Year End Month')).toBeInTheDocument();
    expect(screen.getByLabelText('Default Payment Terms (days)')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact Phone')).toBeInTheDocument();
  });

  it('displays current values from settings', () => {
    render(<SettingsForm settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Organisation Name')).toHaveValue('Acme Corp');
    expect(screen.getByLabelText('Country')).toHaveValue('NZ');
    expect(screen.getByLabelText('Tax ID / GST Number')).toHaveValue('123-456-789');
    expect(screen.getByLabelText('Industry')).toHaveValue('Professional Services');
    expect(screen.getByLabelText('Base Currency')).toHaveValue('NZD');
  });

  it('renders individual Save buttons for each field', () => {
    render(<SettingsForm settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByTestId('save-setting-org_name')).toBeInTheDocument();
    expect(screen.getByTestId('save-setting-country')).toBeInTheDocument();
  });

  it('renders Save All Changes button', () => {
    render(<SettingsForm settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByTestId('save-all-settings')).toBeInTheDocument();
    expect(screen.getByTestId('save-all-settings')).toHaveTextContent('Save All Changes');
  });

  it('calls onSave with key and value when individual Save is clicked', () => {
    const onSave = vi.fn();
    render(<SettingsForm settings={MOCK_SETTINGS} onSave={onSave} />);

    // Change the org name
    const nameInput = screen.getByLabelText('Organisation Name');
    fireEvent.change(nameInput, { target: { value: 'New Corp' } });

    fireEvent.click(screen.getByTestId('save-setting-org_name'));
    expect(onSave).toHaveBeenCalledWith('org_name', 'New Corp');
  });

  it('calls onSave for changed fields when Save All is clicked', () => {
    const onSave = vi.fn();
    render(<SettingsForm settings={MOCK_SETTINGS} onSave={onSave} />);

    // Change the country
    const countryInput = screen.getByLabelText('Country');
    fireEvent.change(countryInput, { target: { value: 'AU' } });

    fireEvent.click(screen.getByTestId('save-all-settings'));
    expect(onSave).toHaveBeenCalledWith('country', 'AU');
  });

  it('shows empty values when settings are empty', () => {
    render(<SettingsForm settings={{}} onSave={vi.fn()} />);
    expect(screen.getByLabelText('Organisation Name')).toHaveValue('');
    expect(screen.getByLabelText('Country')).toHaveValue('');
  });

  it('renders header', () => {
    render(<SettingsForm settings={MOCK_SETTINGS} onSave={vi.fn()} />);
    expect(screen.getByText('Organisation Settings')).toBeInTheDocument();
  });

  it('disables save buttons when saving', () => {
    render(<SettingsForm settings={MOCK_SETTINGS} onSave={vi.fn()} saving />);
    expect(screen.getByTestId('save-all-settings')).toBeDisabled();
  });
});
