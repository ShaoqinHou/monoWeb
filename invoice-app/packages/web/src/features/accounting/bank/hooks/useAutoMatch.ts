import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../../../../lib/api-helpers';
import { bankKeys } from './keys';

export interface AutoMatchSuggestion {
  ruleId: string;
  ruleName: string;
  accountCode: string;
  confidence: number;
  matchedField: string;
}

/** Fetch auto-match suggestions for a transaction based on bank rules */
export function useAutoMatchSuggestions(transactionId: string) {
  return useQuery({
    queryKey: [...bankKeys.all, 'auto-match', transactionId] as const,
    queryFn: async (): Promise<AutoMatchSuggestion[]> => {
      return apiFetch<AutoMatchSuggestion[]>(
        `/bank-transactions/${transactionId}/auto-match`,
      );
    },
    staleTime: 1 * 60 * 1000,
    enabled: !!transactionId,
  });
}

/** Apply an auto-match rule to a transaction */
export function useApplyAutoMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { transactionId: string; ruleId: string }) => {
      return apiPost<{ success: boolean }>(
        `/bank-transactions/${params.transactionId}/apply-rule`,
        { ruleId: params.ruleId },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.all });
    },
  });
}
