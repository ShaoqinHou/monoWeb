import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { billKeys } from './keys';

export interface BatchPaymentInput {
  billIds: string[];
  paymentDate: string;
  accountCode: string;
}

export interface BatchPaymentResult {
  count: number;
  payments: Array<{ billId: string; paymentId: string }>;
  message: string;
}

export function useBatchPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BatchPaymentInput) =>
      apiPost<BatchPaymentResult>('/bills/batch-payment', {
        billIds: input.billIds,
        paymentDate: input.paymentDate,
        bankAccount: input.accountCode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}
