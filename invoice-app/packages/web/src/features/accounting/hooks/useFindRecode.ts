import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../lib/api-helpers';
import { accountingKeys } from './keys';

export interface TransactionSearchFilters {
  accountCode?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  reference?: string;
}

export interface TransactionResult {
  id: string;
  date: string;
  type: 'invoice' | 'bill' | 'journal';
  reference: string;
  description: string;
  accountCode: string;
  accountName: string;
  amount: number;
  taxRate: number;
}

export interface RecodePayload {
  transactionIds: string[];
  newAccountCode: string;
  newTaxRate?: number;
}

const findRecodeKeys = {
  all: () => [...accountingKeys.all, 'find-recode'] as const,
  search: (filters: TransactionSearchFilters) =>
    [...findRecodeKeys.all(), 'search', filters] as const,
};

export { findRecodeKeys };

export function useSearchTransactions(filters: TransactionSearchFilters | null) {
  return useQuery({
    queryKey: findRecodeKeys.search(filters ?? {}),
    queryFn: () =>
      apiPost<TransactionResult[]>('/accounts/find-recode/search', filters),
    enabled: filters !== null,
    staleTime: 30 * 1000,
  });
}

export function useRecodeTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecodePayload) =>
      apiPost<{ updated: number }>('/accounts/find-recode/recode', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: findRecodeKeys.all() });
      queryClient.invalidateQueries({ queryKey: accountingKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: accountingKeys.journals() });
    },
  });
}
