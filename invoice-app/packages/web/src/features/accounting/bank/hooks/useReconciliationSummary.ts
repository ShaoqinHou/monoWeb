import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../../lib/api-helpers';
import { bankKeys } from './keys';

export interface DateRange {
  start: string;
  end: string;
}

export interface AccountReconciliationSummary {
  accountId: string;
  accountName: string;
  statementBalance: number;
  xeroBalance: number;
  difference: number;
  reconciledCount: number;
  unreconciledCount: number;
}

export type ReconciliationStatus = 'reconciled' | 'partial' | 'discrepancy';

/** Determine color-coding status for a reconciliation summary */
export function getReconciliationStatus(summary: AccountReconciliationSummary): ReconciliationStatus {
  if (summary.unreconciledCount === 0 && Math.abs(summary.difference) < 0.01) {
    return 'reconciled';
  }
  if (Math.abs(summary.difference) > 100) {
    return 'discrepancy';
  }
  return 'partial';
}

/** Fetch reconciliation summary per bank account for a date range */
export function useReconciliationSummary(dateRange?: DateRange) {
  return useQuery({
    queryKey: [...bankKeys.all, 'reconciliation-summary', dateRange?.start, dateRange?.end] as const,
    queryFn: async (): Promise<AccountReconciliationSummary[]> => {
      const params = new URLSearchParams();
      if (dateRange?.start) params.set('start', dateRange.start);
      if (dateRange?.end) params.set('end', dateRange.end);
      const qs = params.toString();
      return apiFetch<AccountReconciliationSummary[]>(
        `/bank-transactions/reconciliation-summary${qs ? `?${qs}` : ''}`,
      );
    },
    staleTime: 1 * 60 * 1000,
  });
}
