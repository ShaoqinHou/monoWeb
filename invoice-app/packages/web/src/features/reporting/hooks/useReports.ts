import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { reportingKeys } from './keys';
import type { DateRange, ProfitAndLossReport, BalanceSheetReport, AgedReport, CashFlowForecastReport } from '../types';
import type { TrialBalanceAccount } from '../components/TrialBalanceReport';
import type { AccountingBasis } from '../components/BasisToggle';

/** Fetch P&L report from API */
function fetchProfitAndLoss(dateRange: DateRange, basis: AccountingBasis = 'accrual'): Promise<ProfitAndLossReport> {
  return apiFetch<ProfitAndLossReport>(
    `/reports/profit-and-loss?start=${dateRange.from}&end=${dateRange.to}&basis=${basis}`,
  );
}

/** Fetch Balance Sheet report from API */
function fetchBalanceSheet(asAt: string): Promise<BalanceSheetReport> {
  return apiFetch<BalanceSheetReport>(
    `/reports/balance-sheet?asAt=${asAt}`,
  );
}

/** Fetch Aged Receivables report from API */
function fetchAgedReceivables(): Promise<AgedReport> {
  return apiFetch<AgedReport>('/reports/aged-receivables');
}

/** Fetch Aged Payables report from API */
function fetchAgedPayables(): Promise<AgedReport> {
  return apiFetch<AgedReport>('/reports/aged-payables');
}

/** Fetch Trial Balance report from API */
function fetchTrialBalance(asAt: string): Promise<TrialBalanceAccount[]> {
  return apiFetch<TrialBalanceAccount[]>(`/reports/trial-balance?asAt=${asAt}`);
}

/** Fetch Cash Flow Forecast report from API */
function fetchCashFlowForecast(days: number): Promise<CashFlowForecastReport> {
  return apiFetch<CashFlowForecastReport>(`/reports/cash-flow-forecast?days=${days}`);
}

/** Hook to fetch Profit and Loss report */
export function useProfitAndLoss(dateRange: DateRange, basis: AccountingBasis = 'accrual') {
  return useQuery({
    queryKey: reportingKeys.profitAndLoss(dateRange, basis),
    queryFn: () => fetchProfitAndLoss(dateRange, basis),
    staleTime: 5 * 60 * 1000,
  });
}

/** Hook to fetch Balance Sheet report */
export function useBalanceSheet(asAt: string) {
  return useQuery({
    queryKey: reportingKeys.balanceSheet(asAt),
    queryFn: () => fetchBalanceSheet(asAt),
    staleTime: 5 * 60 * 1000,
  });
}

/** Hook to fetch Aged Receivables report */
export function useAgedReceivables() {
  return useQuery({
    queryKey: reportingKeys.agedReceivables(),
    queryFn: fetchAgedReceivables,
    staleTime: 5 * 60 * 1000,
  });
}

/** Hook to fetch Aged Payables report */
export function useAgedPayables() {
  return useQuery({
    queryKey: reportingKeys.agedPayables(),
    queryFn: fetchAgedPayables,
    staleTime: 5 * 60 * 1000,
  });
}

/** Hook to fetch Trial Balance report */
export function useTrialBalance(asAt: string) {
  return useQuery({
    queryKey: reportingKeys.trialBalance(asAt),
    queryFn: () => fetchTrialBalance(asAt),
    staleTime: 5 * 60 * 1000,
  });
}

/** Hook to fetch Cash Flow Forecast report */
export function useCashFlowForecast(days: number) {
  return useQuery({
    queryKey: reportingKeys.cashFlowForecast(days),
    queryFn: () => fetchCashFlowForecast(days),
    staleTime: 5 * 60 * 1000,
  });
}
