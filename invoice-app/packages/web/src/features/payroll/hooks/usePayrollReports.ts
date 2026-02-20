import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';

export type PayrollReportType =
  | 'payroll-activity'
  | 'employee-details'
  | 'leave-balances'
  | 'kiwisaver'
  | 'paye-summary';

export interface PayrollReportDefinition {
  type: PayrollReportType;
  name: string;
  description: string;
}

export const PAYROLL_REPORTS: PayrollReportDefinition[] = [
  { type: 'payroll-activity', name: 'Payroll Activity Summary', description: 'Summary of all pay runs, gross, PAYE, and net pay for the selected period.' },
  { type: 'employee-details', name: 'Employee Details', description: 'Full details of all employees including salary, tax code, and KiwiSaver rates.' },
  { type: 'leave-balances', name: 'Leave Balances', description: 'Current leave balances for all employees across all leave types.' },
  { type: 'kiwisaver', name: 'KiwiSaver', description: 'KiwiSaver contributions (employee and employer) for the selected period.' },
  { type: 'paye-summary', name: 'PAYE Summary', description: 'PAYE tax deductions summary by employee for the selected period.' },
];

export interface DateRange {
  start: string;
  end: string;
}

export interface PayrollReportData {
  type: PayrollReportType;
  title: string;
  columns: string[];
  rows: string[][];
}

export function usePayrollReport(type: PayrollReportType | null, dateRange: DateRange | null) {
  return useQuery({
    queryKey: ['payroll', 'reports', type, dateRange?.start, dateRange?.end],
    queryFn: () => {
      if (!type || !dateRange) return null;
      return apiFetch<PayrollReportData>(
        `/payroll-settings/reports/${type}?start=${dateRange.start}&end=${dateRange.end}`,
      );
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!type && !!dateRange,
  });
}
