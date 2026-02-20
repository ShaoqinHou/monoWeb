import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPut } from '../../../../lib/api-helpers';
import { bankKeys } from './keys';
import type { ApiBankTransaction } from '../types';

/**
 * Undo reconciliation — sets isReconciled=false and clears matched references.
 * PUT /api/bank-transactions/:id
 */
export function useUndoReconciliation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPut<ApiBankTransaction>(`/bank-transactions/${id}`, {
        isReconciled: false,
        matchedInvoiceId: null,
        matchedBillId: null,
        category: null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}
