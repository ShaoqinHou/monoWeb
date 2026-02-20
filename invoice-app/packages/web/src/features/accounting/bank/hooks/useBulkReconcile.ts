import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../../lib/api-helpers';
import { bankKeys } from './keys';
import { showToast } from '../../../dashboard/components/ToastContainer';

export interface BulkReconcileResult {
  reconciled: number;
  failed: number;
}

/** Reconcile multiple matched transactions at once */
export function useBulkReconcile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionIds: string[]): Promise<BulkReconcileResult> => {
      return apiPost<BulkReconcileResult>('/bank-transactions/bulk-reconcile', {
        transactionIds,
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
      showToast('success', `Reconciled ${result.reconciled} transaction(s)`);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to bulk reconcile');
    },
  });
}
