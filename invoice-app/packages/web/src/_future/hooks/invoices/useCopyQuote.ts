import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../lib/api-helpers';
import { quoteKeys } from './quoteKeys';
import type { Quote } from './useQuotes';

interface CopyQuoteResult {
  quote: Quote;
}

export function useCopyQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string): Promise<CopyQuoteResult> => {
      const source = await apiFetch<Quote>(`/quotes/${quoteId}`);

      const today = new Date().toISOString().split('T')[0];
      const newQuote = await apiPost<Quote>('/quotes', {
        contactId: source.contactId,
        date: today,
        expiryDate: today,
        title: source.title ?? '',
        summary: source.summary ?? '',
        reference: source.reference ?? '',
        lineItems: (source.lineItems ?? []).map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          taxRate: li.taxRate,
          discount: li.discount,
        })),
      });

      return { quote: newQuote };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}
