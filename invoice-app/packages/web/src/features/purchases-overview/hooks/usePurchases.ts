import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { purchasesKeys } from './keys';
import type { Bill } from '../../bills/types';

export interface PurchasesSummaryData {
  totalPurchasesYTD: number;
  outstandingBills: number;
  overdueAmount: number;
}

export interface MonthlyPurchasesData {
  month: string;
  amount: number;
}

export type BillStatus = 'paid' | 'awaiting_payment' | 'overdue' | 'draft';

export interface RecentBill {
  id: string;
  reference: string;
  supplier: string;
  amount: number;
  date: string;
  status: BillStatus;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isOverdue(bill: Bill): boolean {
  if (bill.status === 'paid' || bill.status === 'voided') return false;
  const now = new Date();
  const due = new Date(bill.dueDate);
  return due < now && bill.amountDue > 0;
}

function computeSummary(bills: Bill[], year: number): PurchasesSummaryData {
  let totalPurchasesYTD = 0;
  let outstandingBills = 0;
  let overdueAmount = 0;

  for (const bill of bills) {
    const billYear = new Date(bill.date).getFullYear();
    if (billYear === year && bill.status !== 'voided') {
      totalPurchasesYTD += bill.total;
    }
    if (bill.status !== 'paid' && bill.status !== 'voided' && bill.status !== 'draft') {
      outstandingBills += bill.amountDue;
    }
    if (isOverdue(bill)) {
      overdueAmount += bill.amountDue;
    }
  }

  return { totalPurchasesYTD, outstandingBills, overdueAmount };
}

function computeChart(bills: Bill[], year: number): MonthlyPurchasesData[] {
  const monthly = new Array<number>(12).fill(0);

  for (const bill of bills) {
    const d = new Date(bill.date);
    if (d.getFullYear() === year && bill.status !== 'voided') {
      monthly[d.getMonth()] += bill.total;
    }
  }

  return MONTH_NAMES.map((month, i) => ({ month, amount: monthly[i] }));
}

function mapBillStatus(bill: Bill): BillStatus {
  if (bill.status === 'paid') return 'paid';
  if (bill.status === 'draft') return 'draft';
  if (isOverdue(bill)) return 'overdue';
  return 'awaiting_payment';
}

function computeRecent(bills: Bill[]): RecentBill[] {
  return bills
    .filter((b) => b.status !== 'voided')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      reference: b.billNumber ?? '',
      supplier: b.contactName,
      amount: b.total,
      date: b.date,
      status: mapBillStatus(b),
    }));
}

export function usePurchasesSummary() {
  const currentYear = new Date().getFullYear();
  return useQuery({
    queryKey: purchasesKeys.summary(),
    queryFn: async (): Promise<PurchasesSummaryData> => {
      const bills = await apiFetch<Bill[]>('/bills');
      return computeSummary(bills, currentYear);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePurchasesChart(year: number) {
  return useQuery({
    queryKey: purchasesKeys.chart(year),
    queryFn: async (): Promise<MonthlyPurchasesData[]> => {
      const bills = await apiFetch<Bill[]>('/bills');
      return computeChart(bills, year);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentBills() {
  return useQuery({
    queryKey: purchasesKeys.recent(),
    queryFn: async (): Promise<RecentBill[]> => {
      const bills = await apiFetch<Bill[]>('/bills');
      return computeRecent(bills);
    },
    staleTime: 1 * 60 * 1000,
  });
}
