import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';

export interface ExpiringQuote {
  id: string;
  quoteNumber: string;
  contactName: string;
  total: number;
  currency: string;
  expiryDate: string;
  daysUntilExpiry: number; // negative = past expiry
  status: 'expiring' | 'expired';
}

// Shape returned from the API (full quote row + computed fields)
interface ApiExpiringQuote {
  id: string;
  quoteNumber: string;
  contactName: string;
  total: number;
  currency: string;
  expiryDate: string;
  daysUntilExpiry: number;
  expiryStatus: 'expiring' | 'expired';
}

export function useExpiringQuotes() {
  return useQuery({
    queryKey: ['quotes', 'expiring'],
    queryFn: async () => {
      const apiData = await apiFetch<ApiExpiringQuote[]>('/quotes/expiring');
      // Map API response to match the component-expected ExpiringQuote shape
      return apiData.map((q): ExpiringQuote => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        contactName: q.contactName,
        total: q.total,
        currency: q.currency,
        expiryDate: q.expiryDate,
        daysUntilExpiry: q.daysUntilExpiry,
        status: q.expiryStatus,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSendQuoteFollowUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      // Follow-up email sending is mock in demo — no real endpoint needed
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { success: true, quoteId, sentAt: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', 'expiring'] });
    },
  });
}
