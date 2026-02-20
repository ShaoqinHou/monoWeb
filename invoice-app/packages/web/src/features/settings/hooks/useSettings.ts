import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { settingsKeys } from './keys';
import type { OrganizationSettings, UserProfile } from '../types';

const DEFAULT_SETTINGS: OrganizationSettings = {
  name: 'Demo Company (NZ)',
  industry: 'Professional Services',
  address: '123 Lambton Quay, Wellington 6011, New Zealand',
  gstNumber: '123-456-789',
  financialYearEnd: 3, // March
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

const MOCK_USER: UserProfile = {
  name: 'Demo User',
  email: 'demo@xero.com',
  role: 'Financial Adviser',
  lastLogin: '2026-02-16T08:30:00Z',
};

/**
 * The settings API stores key-value pairs.
 * We store the org settings as a single JSON blob under the key 'organization'.
 */
export function useOrganizationSettings() {
  return useQuery({
    queryKey: settingsKeys.organization(),
    queryFn: async (): Promise<OrganizationSettings> => {
      try {
        const result = await apiFetch<Record<string, string>>('/settings');
        if (result['organization']) {
          const parsed = JSON.parse(result['organization']) as Partial<OrganizationSettings>;
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      } catch {
        // API not available or no settings stored yet — fall back to defaults
      }
      return { ...DEFAULT_SETTINGS };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: settingsKeys.user(),
    queryFn: async (): Promise<UserProfile> => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { ...MOCK_USER };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<OrganizationSettings>): Promise<OrganizationSettings> => {
      const current = queryClient.getQueryData<OrganizationSettings>(settingsKeys.organization());
      const merged = { ...DEFAULT_SETTINGS, ...current, ...settings };
      await apiPut<unknown>('/settings/organization', { value: JSON.stringify(merged) });
      return merged;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.organization(), data);
    },
  });
}

export { DEFAULT_SETTINGS, MOCK_USER };
