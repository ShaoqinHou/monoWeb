import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../../lib/api-helpers';
import { bankKeys } from './keys';
import type { MatchSuggestionData } from '../types';

/** Fetch smart match suggestions for a specific bank transaction */
export function useMatchSuggestions(transactionId: string) {
  return useQuery({
    queryKey: bankKeys.suggestions(transactionId),
    queryFn: () =>
      apiFetch<MatchSuggestionData[]>(`/bank-transactions/${transactionId}/suggestions`),
    staleTime: 60 * 1000,
    enabled: !!transactionId,
  });
}
