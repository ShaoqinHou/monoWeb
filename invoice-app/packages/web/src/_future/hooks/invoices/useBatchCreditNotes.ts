import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { invoiceKeys } from './keys';
import { creditNoteKeys } from './creditNoteKeys';

export interface CreditNoteItem {
  invoiceId: string;
  amount?: number; // undefined = full credit
  reason: string;
}

export interface BatchCreditNoteRequest {
  items: CreditNoteItem[];
}

export interface BatchCreditNoteResult {
  createdIds: string[];
  failed: Array<{ invoiceId: string; error: string }>;
}

/** Create credit notes for multiple invoices at once */
export function useBatchCreateCreditNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: BatchCreditNoteRequest) =>
      apiPost<BatchCreditNoteResult>('/invoices/batch-credit-notes', request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.lists() });
    },
  });
}
