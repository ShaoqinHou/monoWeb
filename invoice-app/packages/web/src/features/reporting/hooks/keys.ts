import type { DateRange } from '../types';
import type { AccountingBasis } from '../components/BasisToggle';

/** Query key factory for reporting feature */
export const reportingKeys = {
  all: ['reporting'] as const,
  profitAndLoss: (dateRange: DateRange, basis?: AccountingBasis) =>
    ['reporting', 'profit-and-loss', dateRange.from, dateRange.to, basis ?? 'accrual'] as const,
  balanceSheet: (asAt: string) =>
    ['reporting', 'balance-sheet', asAt] as const,
  agedReceivables: () =>
    ['reporting', 'aged-receivables'] as const,
  agedPayables: () =>
    ['reporting', 'aged-payables'] as const,
  trialBalance: (asAt: string) =>
    ['reporting', 'trial-balance', asAt] as const,
  cashFlowForecast: (days: number) =>
    ['reporting', 'cash-flow-forecast', days] as const,
};
