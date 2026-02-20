import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { recurringInvoiceKeys } from './recurringInvoiceKeys';
import { invoiceKeys } from './keys';

interface GenerateDueResult {
  generated: Array<{
    invoiceId: string;
    recurringId: string;
    invoiceNumber: string;
  }>;
}

/** Generate invoices for all active recurring templates that are due */
export function useGenerateDueRecurringInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost<GenerateDueResult>('/recurring-invoices/generate-due', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/** Generate bills for all active recurring bill templates that are due */
export function useGenerateDueRecurringBills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost<GenerateDueResult>('/recurring-bills/generate-due', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bills'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}
