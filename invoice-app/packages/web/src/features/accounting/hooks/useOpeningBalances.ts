import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../lib/api-helpers';

export interface OpeningBalance {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

const openingBalanceKeys = {
  all: ['opening-balances'] as const,
};

export function useOpeningBalances() {
  return useQuery({
    queryKey: openingBalanceKeys.all,
    queryFn: () => apiFetch<OpeningBalance[]>('/accounts/opening-balances'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveOpeningBalances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (balances: OpeningBalance[]) =>
      apiPost<{ saved: number }>('/accounts/opening-balances', { balances }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: openingBalanceKeys.all });
    },
  });
}
