import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPut } from '../../../lib/api-helpers';
import { settingsKeys } from './keys';

export interface CurrencyEntry {
  code: string;
  name: string;
  rate: number;
  enabled: boolean;
}

export function useCurrencies() {
  return useQuery({
    queryKey: [...settingsKeys.all, 'currencies'] as const,
    queryFn: () => apiFetch<CurrencyEntry[]>('/currencies'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCurrencyRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, rate }: { code: string; rate: number }) =>
      apiPut<CurrencyEntry>(`/currencies/${code}`, { rate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...settingsKeys.all, 'currencies'] });
    },
  });
}

export function useToggleCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, enabled }: { code: string; enabled: boolean }) =>
      apiPut<CurrencyEntry>(`/currencies/${code}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...settingsKeys.all, 'currencies'] });
    },
  });
}
