import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { invoiceKeys } from './keys';

interface BulkApproveResult {
  approved: string[];
  skipped: string[];
}

/** Bulk approve invoices (only submitted invoices will be approved) */
export function useBulkApproveInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceIds: string[]) =>
      apiPost<BulkApproveResult>('/invoices/bulk-approve', { invoiceIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
