import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { reportingKeys } from './keys';
import type { DateRange, ProfitAndLossReport, BalanceSheetReport } from '../types';

export type CompareMode = 'prior-period' | 'same-period-last-year';

export interface ComparisonRow {
  label: string;
  current: number;
  prior: number;
  change: number;
  changePercent: number | null;
}

export interface ReportComparison<T> {
  current: T;
  prior: T;
}

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computePriorRange(range: DateRange, mode: CompareMode): DateRange {
  const from = new Date(range.from + 'T12:00:00');
  const to = new Date(range.to + 'T12:00:00');

  if (mode === 'same-period-last-year') {
    const priorFrom = new Date(from);
    priorFrom.setFullYear(priorFrom.getFullYear() - 1);
    const priorTo = new Date(to);
    priorTo.setFullYear(priorTo.getFullYear() - 1);
    return {
      from: toLocalISODate(priorFrom),
      to: toLocalISODate(priorTo),
    };
  }

  // prior-period: shift back by the duration of the range
  const durationMs = to.getTime() - from.getTime();
  const priorTo = new Date(from.getTime() - 86400000); // day before from
  const priorFrom = new Date(priorTo.getTime() - durationMs);
  return {
    from: toLocalISODate(priorFrom),
    to: toLocalISODate(priorTo),
  };
}

async function fetchPnlComparison(
  currentRange: DateRange,
  compareMode: CompareMode,
): Promise<ReportComparison<ProfitAndLossReport>> {
  const priorRange = computePriorRange(currentRange, compareMode);
  const [current, prior] = await Promise.all([
    apiFetch<ProfitAndLossReport>(
      `/reports/profit-and-loss?start=${currentRange.from}&end=${currentRange.to}`,
    ),
    apiFetch<ProfitAndLossReport>(
      `/reports/profit-and-loss?start=${priorRange.from}&end=${priorRange.to}`,
    ),
  ]);
  return { current, prior };
}

async function fetchBsComparison(
  currentAsAt: string,
  compareMode: CompareMode,
): Promise<ReportComparison<BalanceSheetReport>> {
  const currentRange: DateRange = { from: currentAsAt, to: currentAsAt };
  const priorRange = computePriorRange(currentRange, compareMode);
  const priorAsAt = priorRange.to;
  const [current, prior] = await Promise.all([
    apiFetch<BalanceSheetReport>(`/reports/balance-sheet?asAt=${currentAsAt}`),
    apiFetch<BalanceSheetReport>(`/reports/balance-sheet?asAt=${priorAsAt}`),
  ]);
  return { current, prior };
}

export function usePnlComparison(dateRange: DateRange, compareMode: CompareMode, enabled: boolean) {
  return useQuery({
    queryKey: [...reportingKeys.profitAndLoss(dateRange), 'compare', compareMode],
    queryFn: () => fetchPnlComparison(dateRange, compareMode),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useBsComparison(asAt: string, compareMode: CompareMode, enabled: boolean) {
  return useQuery({
    queryKey: [...reportingKeys.balanceSheet(asAt), 'compare', compareMode],
    queryFn: () => fetchBsComparison(asAt, compareMode),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function computeChange(current: number, prior: number): { change: number; changePercent: number | null } {
  const change = current - prior;
  const changePercent = prior !== 0 ? (change / Math.abs(prior)) * 100 : null;
  return { change, changePercent };
}

export { computePriorRange };
