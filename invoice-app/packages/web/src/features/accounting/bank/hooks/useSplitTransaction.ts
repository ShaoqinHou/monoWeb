import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../../lib/api-helpers';
import { bankKeys } from './keys';

export interface SplitLine {
  accountCode: string;
  amount: number;
  taxRate: string;
  description: string;
}

export interface SplitTransactionParams {
  transactionId: string;
  lines: SplitLine[];
}

export const MAX_SPLIT_LINES = 10;

/** Validate that split lines total matches the original transaction amount */
export function validateSplitTotal(lines: SplitLine[], originalAmount: number): string | null {
  if (lines.length === 0) {
    return 'At least one split line is required';
  }
  if (lines.length > MAX_SPLIT_LINES) {
    return `Maximum ${MAX_SPLIT_LINES} split lines allowed`;
  }
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const diff = Math.abs(total - originalAmount);
  if (diff > 0.01) {
    return `Split total ($${total.toFixed(2)}) does not match transaction amount ($${originalAmount.toFixed(2)})`;
  }
  for (const line of lines) {
    if (!line.accountCode) {
      return 'All split lines require an account code';
    }
    if (line.amount === 0) {
      return 'Split line amounts cannot be zero';
    }
  }
  return null;
}

/** Split a bank transaction into multiple lines */
export function useSplitTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SplitTransactionParams) => {
      return apiPost<{ success: boolean }>(
        `/bank-transactions/${params.transactionId}/split`,
        { lines: params.lines },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}
