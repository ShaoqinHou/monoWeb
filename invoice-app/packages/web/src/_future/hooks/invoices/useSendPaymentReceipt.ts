import { useMutation } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';

export interface PaymentReceiptData {
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  contactName: string;
  contactEmail: string;
  paymentAmount: number;
  paymentDate: string;
  currency: string;
  remainingBalance: number;
}

export interface SendReceiptResult {
  success: boolean;
  sentAt: string;
}

export function useSendPaymentReceipt() {
  return useMutation({
    mutationFn: async (data: PaymentReceiptData): Promise<SendReceiptResult> => {
      return apiPost<SendReceiptResult>(
        `/invoices/${data.invoiceId}/payment-receipt`,
        data,
      );
    },
  });
}
