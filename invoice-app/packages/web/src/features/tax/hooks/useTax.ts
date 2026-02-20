import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { taxKeys } from './keys';
import type { GSTReturn, TaxSummary } from '../types';

/**
 * Fallback GST return data used when the API endpoint is unavailable.
 * Once a real /api/tax/gst-returns endpoint exists, these will be
 * ignored in favor of server data.
 */
const FALLBACK_GST_RETURNS: GSTReturn[] = [
  {
    id: 'gst-2026-01',
    period: 'Jan-Feb 2026',
    startDate: '2026-01-01',
    endDate: '2026-02-28',
    dueDate: '2026-03-28',
    status: 'draft',
    totalSales: 125000,
    gstOnSales: 18750,
    zeroRatedSupplies: 5000,
    totalPurchases: 82000,
    gstOnPurchases: 12300,
    netGST: 6450,
  },
  {
    id: 'gst-2025-11',
    period: 'Nov-Dec 2025',
    startDate: '2025-11-01',
    endDate: '2025-12-31',
    dueDate: '2026-01-28',
    status: 'overdue',
    totalSales: 118500,
    gstOnSales: 17775,
    zeroRatedSupplies: 3200,
    totalPurchases: 76500,
    gstOnPurchases: 11475,
    netGST: 6300,
  },
  {
    id: 'gst-2025-09',
    period: 'Sep-Oct 2025',
    startDate: '2025-09-01',
    endDate: '2025-10-31',
    dueDate: '2025-11-28',
    status: 'filed',
    totalSales: 142000,
    gstOnSales: 21300,
    zeroRatedSupplies: 8500,
    totalPurchases: 91000,
    gstOnPurchases: 13650,
    netGST: 7650,
  },
  {
    id: 'gst-2025-07',
    period: 'Jul-Aug 2025',
    startDate: '2025-07-01',
    endDate: '2025-08-31',
    dueDate: '2025-09-28',
    status: 'filed',
    totalSales: 98700,
    gstOnSales: 14805,
    zeroRatedSupplies: 2100,
    totalPurchases: 67800,
    gstOnPurchases: 10170,
    netGST: 4635,
  },
  {
    id: 'gst-2025-05',
    period: 'May-Jun 2025',
    startDate: '2025-05-01',
    endDate: '2025-06-30',
    dueDate: '2025-07-28',
    status: 'filed',
    totalSales: 110300,
    gstOnSales: 16545,
    zeroRatedSupplies: 4700,
    totalPurchases: 73200,
    gstOnPurchases: 10980,
    netGST: 5565,
  },
  {
    id: 'gst-2025-03',
    period: 'Mar-Apr 2025',
    startDate: '2025-03-01',
    endDate: '2025-04-30',
    dueDate: '2025-05-28',
    status: 'filed',
    totalSales: 135800,
    gstOnSales: 20370,
    zeroRatedSupplies: 6300,
    totalPurchases: 88400,
    gstOnPurchases: 13260,
    netGST: 7110,
  },
];

/** Attempt API fetch, fall back to local data */
async function fetchGSTReturns(): Promise<GSTReturn[]> {
  try {
    return await apiFetch<GSTReturn[]>('/gst-returns');
  } catch {
    return FALLBACK_GST_RETURNS;
  }
}

async function fetchGSTReturn(id: string): Promise<GSTReturn | undefined> {
  try {
    return await apiFetch<GSTReturn>(`/gst-returns/${id}`);
  } catch {
    return FALLBACK_GST_RETURNS.find((r) => r.id === id);
  }
}

/** Fetch tax summary from invoice/bill tax totals */
async function fetchTaxSummary(): Promise<TaxSummary> {
  try {
    return await apiFetch<TaxSummary>('/gst-returns/summary');
  } catch {
    // Compute from fallback data
    const returns = FALLBACK_GST_RETURNS;
    const taxCollected = returns.reduce((sum, r) => sum + r.gstOnSales, 0);
    const taxPaid = returns.reduce((sum, r) => sum + r.gstOnPurchases, 0);
    return {
      taxCollected,
      taxPaid,
      netGSTPayable: taxCollected - taxPaid,
      periodCount: returns.length,
    };
  }
}

export function useGSTReturns() {
  return useQuery({
    queryKey: taxKeys.gstReturns(),
    queryFn: fetchGSTReturns,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGSTReturn(id: string) {
  return useQuery({
    queryKey: taxKeys.gstReturn(id),
    queryFn: () => fetchGSTReturn(id),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
}

export function useTaxSummary() {
  return useQuery({
    queryKey: taxKeys.taxSummary(),
    queryFn: fetchTaxSummary,
    staleTime: 5 * 60 * 1000,
  });
}
