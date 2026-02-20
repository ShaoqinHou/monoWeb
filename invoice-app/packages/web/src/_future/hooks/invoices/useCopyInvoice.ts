import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { invoiceKeys } from './keys';
import type { Invoice } from '../types';

interface CopyInvoiceResult {
  invoice: Invoice;
}

export function useCopyInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string): Promise<CopyInvoiceResult> => {
      const newInvoice = await apiPost<Invoice>(`/invoices/${invoiceId}/copy`, {});
      return { invoice: newInvoice };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
