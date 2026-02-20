import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { taxKeys } from './keys';

export interface TaxAuditFilters {
  dateFrom: string;
  dateTo: string;
  taxRate?: string;
  account?: string;
}

export interface TaxAuditTransaction {
  id: string;
  date: string;
  type: 'Invoice' | 'Bill' | 'Credit Note' | 'Payment';
  reference: string;
  contact: string;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  taxRate: string;
  account: string;
}

export interface TaxAuditTotals {
  totalNet: number;
  totalTax: number;
  totalGross: number;
}

function calculateTotals(transactions: TaxAuditTransaction[]): TaxAuditTotals {
  return transactions.reduce(
    (acc, tx) => ({
      totalNet: acc.totalNet + tx.netAmount,
      totalTax: acc.totalTax + tx.taxAmount,
      totalGross: acc.totalGross + tx.grossAmount,
    }),
    { totalNet: 0, totalTax: 0, totalGross: 0 },
  );
}

/** Fetch tax audit transactions from the API */
async function fetchTaxAuditTransactions(filters: TaxAuditFilters): Promise<TaxAuditTransaction[]> {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  if (filters.taxRate) params.set('taxRate', filters.taxRate);
  if (filters.account) params.set('account', filters.account);

  return apiFetch<TaxAuditTransaction[]>(`/gst-returns/audit-transactions?${params.toString()}`);
}

/**
 * Query hook for the tax audit report.
 * Returns transactions from the API and computed totals.
 */
export function useTaxAuditReport(filters: TaxAuditFilters) {
  const query = useQuery({
    queryKey: [...taxKeys.all, 'audit', filters.dateFrom, filters.dateTo, filters.taxRate, filters.account],
    queryFn: () => fetchTaxAuditTransactions(filters),
    staleTime: 5 * 60 * 1000,
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });

  const transactions = query.data ?? [];
  const totals = useMemo(() => calculateTotals(transactions), [transactions]);

  return {
    ...query,
    transactions,
    totals,
  };
}

/**
 * Client-side filter utility, kept for backward compatibility with tests.
 * The API now handles filtering via query params, but this is still useful for local filtering.
 */
function filterTransactions(
  transactions: TaxAuditTransaction[],
  filters: TaxAuditFilters,
): TaxAuditTransaction[] {
  return transactions.filter((tx) => {
    if (tx.date < filters.dateFrom || tx.date > filters.dateTo) return false;
    if (filters.taxRate && tx.taxRate !== filters.taxRate) return false;
    if (filters.account && tx.account !== filters.account) return false;
    return true;
  });
}

/** Legacy fallback data kept for backward compatibility with tests */
const MOCK_TRANSACTIONS: TaxAuditTransaction[] = [
  { id: 'ta-1', date: '2026-01-15', type: 'Invoice', reference: 'INV-001', contact: 'Acme Ltd', netAmount: 5000, taxAmount: 750, grossAmount: 5750, taxRate: '15%', account: 'Sales' },
  { id: 'ta-2', date: '2026-01-18', type: 'Bill', reference: 'BILL-042', contact: 'Office Supplies Co', netAmount: 800, taxAmount: 120, grossAmount: 920, taxRate: '15%', account: 'Office Expenses' },
  { id: 'ta-3', date: '2026-01-22', type: 'Invoice', reference: 'INV-002', contact: 'Beta Corp', netAmount: 12000, taxAmount: 1800, grossAmount: 13800, taxRate: '15%', account: 'Sales' },
  { id: 'ta-4', date: '2026-01-25', type: 'Credit Note', reference: 'CN-003', contact: 'Acme Ltd', netAmount: -500, taxAmount: -75, grossAmount: -575, taxRate: '15%', account: 'Sales' },
  { id: 'ta-5', date: '2026-02-01', type: 'Bill', reference: 'BILL-043', contact: 'Web Hosting Inc', netAmount: 200, taxAmount: 30, grossAmount: 230, taxRate: '15%', account: 'IT Expenses' },
  { id: 'ta-6', date: '2026-02-05', type: 'Invoice', reference: 'INV-003', contact: 'Gamma Industries', netAmount: 8500, taxAmount: 1275, grossAmount: 9775, taxRate: '15%', account: 'Sales' },
  { id: 'ta-7', date: '2025-12-10', type: 'Invoice', reference: 'INV-098', contact: 'Delta Services', netAmount: 3200, taxAmount: 0, grossAmount: 3200, taxRate: '0%', account: 'Zero-rated Sales' },
  { id: 'ta-8', date: '2025-12-15', type: 'Bill', reference: 'BILL-039', contact: 'Insurance Co', netAmount: 1500, taxAmount: 0, grossAmount: 1500, taxRate: '0%', account: 'Insurance' },
  { id: 'ta-9', date: '2026-02-10', type: 'Payment', reference: 'PAY-021', contact: 'Acme Ltd', netAmount: 4500, taxAmount: 675, grossAmount: 5175, taxRate: '15%', account: 'Sales' },
  { id: 'ta-10', date: '2026-02-12', type: 'Bill', reference: 'BILL-044', contact: 'Cleaning Services', netAmount: 350, taxAmount: 52.5, grossAmount: 402.5, taxRate: '15%', account: 'Cleaning' },
];

export { calculateTotals, filterTransactions, MOCK_TRANSACTIONS };
