import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { salesKeys } from './keys';
import type { Invoice } from '../../invoices/types';

export interface SalesSummaryData {
  totalSalesYTD: number;
  outstandingInvoices: number;
  overdueAmount: number;
  averageDaysToPay: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
}

export interface MonthlySalesData {
  month: string;
  amount: number;
}

export type InvoiceStatus = 'paid' | 'sent' | 'overdue' | 'draft';

export interface RecentInvoice {
  id: string;
  reference: string;
  customer: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
}

function mapStatusForDisplay(status: string, dueDate: string): InvoiceStatus {
  if (status === 'paid') return 'paid';
  if (status === 'draft') return 'draft';
  if (status === 'submitted' || status === 'approved') {
    const due = new Date(dueDate);
    if (due < new Date()) return 'overdue';
    return 'sent';
  }
  return 'draft';
}

function computeSummary(invoices: Invoice[]): SalesSummaryData {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const ytdInvoices = invoices.filter((inv) => new Date(inv.date) >= yearStart);

  const totalSalesYTD = ytdInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const outstandingList = invoices.filter(
    (inv) => inv.status !== 'paid' && inv.status !== 'voided',
  );
  const outstandingInvoices = outstandingList.reduce((sum, inv) => sum + inv.amountDue, 0);
  const overdueList = invoices.filter(
    (inv) =>
      inv.status !== 'paid' &&
      inv.status !== 'voided' &&
      inv.status !== 'draft' &&
      new Date(inv.dueDate) < now,
  );
  const overdueAmount = overdueList.reduce((sum, inv) => sum + inv.amountDue, 0);

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
  const averageDaysToPay =
    paidInvoices.length > 0
      ? Math.round(
          paidInvoices.reduce((sum, inv) => {
            const created = new Date(inv.date);
            const updated = new Date(inv.updatedAt);
            return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / paidInvoices.length,
        )
      : 0;

  return {
    totalSalesYTD,
    outstandingInvoices,
    overdueAmount,
    averageDaysToPay,
    invoiceCount: invoices.length,
    paidCount: paidInvoices.length,
    overdueCount: overdueList.length,
  };
}

function computeMonthlyChart(invoices: Invoice[], year: number): MonthlySalesData[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const totals = new Array<number>(12).fill(0);
  for (const inv of invoices) {
    const d = new Date(inv.date);
    if (d.getFullYear() === year) {
      totals[d.getMonth()] += inv.total;
    }
  }
  return months.map((month, i) => ({ month, amount: totals[i] }));
}

function mapToRecent(invoices: Invoice[], limit: number): RecentInvoice[] {
  return [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map((inv) => ({
      id: inv.id,
      reference: inv.invoiceNumber ?? '',
      customer: inv.contactName,
      amount: inv.total,
      date: inv.date,
      status: mapStatusForDisplay(inv.status, inv.dueDate),
    }));
}

/** Exported for testing */
export { computeSummary, computeMonthlyChart, mapToRecent };

export function useSalesSummary() {
  return useQuery({
    queryKey: salesKeys.summary(),
    queryFn: async (): Promise<SalesSummaryData> => {
      const invoices = await apiFetch<Invoice[]>('/invoices');
      return computeSummary(invoices);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalesChart(year: number) {
  return useQuery({
    queryKey: salesKeys.chart(year),
    queryFn: async (): Promise<MonthlySalesData[]> => {
      const invoices = await apiFetch<Invoice[]>('/invoices');
      return computeMonthlyChart(invoices, year);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentInvoices() {
  return useQuery({
    queryKey: salesKeys.recent(),
    queryFn: async (): Promise<RecentInvoice[]> => {
      const invoices = await apiFetch<Invoice[]>('/invoices');
      return mapToRecent(invoices, 5);
    },
    staleTime: 1 * 60 * 1000,
  });
}
