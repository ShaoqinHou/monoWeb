import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { creditNoteKeys } from './creditNoteKeys';
import { invoiceKeys } from './keys';

interface AllocationResult {
  creditNote: {
    id: string;
    remainingCredit: number;
    status: string;
  };
  allocations: Array<{
    invoiceId: string;
    invoiceNumber: string | null;
    amount: number;
  }>;
}

/** Auto-allocate an approved credit note across oldest unpaid invoices for the same contact */
export function useAutoAllocateCredit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (creditNoteId: string) =>
      apiPost<AllocationResult>(`/credit-notes/${creditNoteId}/auto-allocate`, {}),
    onSuccess: (_data, creditNoteId) => {
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.detail(creditNoteId) });
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
