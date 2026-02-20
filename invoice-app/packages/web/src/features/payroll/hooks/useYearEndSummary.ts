import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';

export interface YearEndEmployee {
  employeeId: string;
  employeeName: string;
  grossPay: number;
  paye: number;
  kiwiSaverEmployee: number;
  kiwiSaverEmployer: number;
  studentLoan: number;
  netPay: number;
}

export interface YearEndSummaryData {
  taxYear: string;
  employees: YearEndEmployee[];
  totals: {
    grossPay: number;
    paye: number;
    kiwiSaverEmployee: number;
    kiwiSaverEmployer: number;
    studentLoan: number;
    netPay: number;
  };
}

export function useYearEndSummary(taxYear: string) {
  return useQuery({
    queryKey: ['payroll', 'year-end-summary', taxYear],
    queryFn: () => apiFetch<YearEndSummaryData>(`/payroll-settings/year-end-summary?taxYear=${taxYear}`),
    staleTime: 5 * 60 * 1000,
  });
}

/** Get NZ tax year options. Tax year "2025" = 1 Apr 2025 - 31 Mar 2026 */
export function getTaxYearOptions() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-based
  // If we're in Jan-Mar, current tax year started last April
  const currentTaxYear = currentMonth < 3 ? currentYear - 1 : currentYear;
  return Array.from({ length: 5 }, (_, i) => {
    const year = currentTaxYear - i;
    return {
      value: String(year),
      label: `${year}/${year + 1} (Apr ${year} - Mar ${year + 1})`,
    };
  });
}
