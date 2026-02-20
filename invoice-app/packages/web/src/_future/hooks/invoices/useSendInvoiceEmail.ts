import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';

export interface SendEmailResult {
  ok: boolean;
  sentAt: string;
}

/** Send an invoice email via POST /api/invoices/:id/email */
export function useSendInvoiceEmail() {
  return useMutation({
    mutationFn: ({ invoiceId, to, subject, body }: {
      invoiceId: string;
      to: string;
      subject: string;
      body: string;
    }) => apiPost<SendEmailResult>(`/invoices/${invoiceId}/email`, { to, subject, body }),
  });
}
