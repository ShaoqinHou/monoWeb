import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { invoiceKeys } from './keys';
import { creditNoteKeys } from './creditNoteKeys';

interface ApplyCreditResult {
  invoiceId: string;
  creditNoteId: string;
  amount: number;
  newAmountDue: number;
  newRemainingCredit: number;
}

/** Apply a credit note to an invoice */
export function useApplyCreditToInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, creditNoteId, amount }: {
      invoiceId: string;
      creditNoteId: string;
      amount: number;
    }) =>
      apiPost<ApplyCreditResult>(`/invoices/${invoiceId}/apply-credit`, {
        creditNoteId,
        amount,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.lists() });
    },
  });
}
