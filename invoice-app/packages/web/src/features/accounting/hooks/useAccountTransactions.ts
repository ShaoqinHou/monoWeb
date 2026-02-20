import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';

export interface AccountTransaction {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
}

export interface DateRange {
  from: string;
  to: string;
}

async function fetchAccountTransactions(
  accountCode: string,
  dateRange?: DateRange,
): Promise<AccountTransaction[]> {
  const params = new URLSearchParams();
  if (dateRange) {
    params.set('from', dateRange.from);
    params.set('to', dateRange.to);
  }
  const qs = params.toString();
  const path = `/accounts/${encodeURIComponent(accountCode)}/transactions${qs ? `?${qs}` : ''}`;
  return apiFetch<AccountTransaction[]>(path);
}

export function useAccountTransactions(accountCode: string, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['account-transactions', accountCode, dateRange],
    queryFn: () => fetchAccountTransactions(accountCode, dateRange),
    staleTime: 60 * 1000,
    enabled: !!accountCode,
  });
}
