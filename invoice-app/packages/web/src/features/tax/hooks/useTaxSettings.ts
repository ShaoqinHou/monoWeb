import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';

/**
 * Shape of the tax-related settings returned by useTaxSettings.
 * All fields may be undefined if the settings haven't been saved yet.
 */
export interface TaxSettings {
  gstNumber: string | undefined;
  gstStartDate: string | undefined;
  accountingBasis: string | undefined;
  filingPeriod: string | undefined;
  gstFormType: string | undefined;
}

/** Default fallback values when settings API has no data */
const DEFAULTS: TaxSettings = {
  gstNumber: '',
  gstStartDate: '',
  accountingBasis: 'Invoice basis (Accrual)',
  filingPeriod: '2-monthly',
  gstFormType: 'GST101A',
};

/** Settings key names as stored in the API key-value store */
const SETTINGS_KEYS = {
  gstNumber: 'gst_number',
  gstStartDate: 'gst_start_date',
  accountingBasis: 'gst_accounting_basis',
  filingPeriod: 'gst_filing_period',
  gstFormType: 'gst_form_type',
} as const;

async function fetchTaxSettings(): Promise<TaxSettings> {
  try {
    const allSettings = await apiFetch<Record<string, string>>('/settings');
    return {
      gstNumber: allSettings[SETTINGS_KEYS.gstNumber] ?? DEFAULTS.gstNumber,
      gstStartDate: allSettings[SETTINGS_KEYS.gstStartDate] ?? DEFAULTS.gstStartDate,
      accountingBasis: allSettings[SETTINGS_KEYS.accountingBasis] ?? DEFAULTS.accountingBasis,
      filingPeriod: allSettings[SETTINGS_KEYS.filingPeriod] ?? DEFAULTS.filingPeriod,
      gstFormType: allSettings[SETTINGS_KEYS.gstFormType] ?? DEFAULTS.gstFormType,
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Fetches tax-related settings from the settings API.
 * Extracts GST number, start date, accounting basis, filing period, and form type
 * from the key-value settings store.
 */
export function useTaxSettings() {
  return useQuery({
    queryKey: ['tax', 'settings'],
    queryFn: fetchTaxSettings,
    staleTime: 5 * 60 * 1000,
  });
}
