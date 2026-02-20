import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { quoteKeys } from './quoteKeys';
import { invoiceKeys } from './keys';

interface ConvertedInvoice {
  id: string;
  invoiceNumber: string;
  sourceQuoteId: string;
  contactId: string;
  contactName: string;
  total: number;
  status: string;
}

/** Convert an accepted quote to an invoice with lineage tracking (sourceQuoteId) */
export function useConvertQuoteToInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) =>
      apiPost<ConvertedInvoice>(`/quotes/${quoteId}/convert`, {}),
    onSuccess: (_data, quoteId) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(quoteId) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
