import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';

export interface BulkEmailResult {
  ok: boolean;
  sentCount: number;
}

/** Send bulk emails for multiple invoices via POST /api/invoices/bulk-email */
export function useBulkEmail() {
  return useMutation({
    mutationFn: ({ invoiceIds, subject }: {
      invoiceIds: string[];
      subject: string;
    }) => apiPost<BulkEmailResult>('/invoices/bulk-email', { invoiceIds, subject }),
  });
}
