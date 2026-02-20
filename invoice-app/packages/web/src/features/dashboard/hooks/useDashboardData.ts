import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api-helpers';
import { dashboardKeys } from './keys';
import type {
  DashboardSummary,
  InvoiceSummary,
  BillSummary,
  CashFlowMonth,
  RecentActivityItem,
  ApiAccount,
} from '../types';

// ── Core query — single API call for all dashboard data ──

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => apiFetch<DashboardSummary>('/dashboard/summary'),
    staleTime: 60 * 1000,
  });
}

// ── Derived hooks — select from the single summary query ──

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Awaiting Approval',
  approved: 'Awaiting Payment',
  overdue: 'Overdue',
};

function deriveInvoiceSummary(data: DashboardSummary): InvoiceSummary {
  const today = new Date().toISOString().split('T')[0];
  const statusMap: Record<string, { count: number; total: number }> = {};

  for (const inv of data.recentInvoices) {
    if (inv.status === 'paid' || inv.status === 'voided') continue;
    const effectiveStatus = inv.dueDate < today && inv.status !== 'draft' ? 'overdue' : inv.status;
    if (!statusMap[effectiveStatus]) statusMap[effectiveStatus] = { count: 0, total: 0 };
    statusMap[effectiveStatus].count++;
    statusMap[effectiveStatus].total += inv.amountDue;
  }

  const byStatus = ['draft', 'submitted', 'approved', 'overdue']
    .filter((s) => statusMap[s])
    .map((s) => ({
      status: s,
      label: STATUS_LABELS[s] ?? s,
      count: statusMap[s].count,
      total: statusMap[s].total,
    }));

  return {
    totalOutstanding: data.totalInvoicesOwed,
    totalOverdue: data.totalInvoicesOverdue,
    overdueCount: data.overdueInvoiceCount,
    currency: 'NZD',
    byStatus,
  };
}

function deriveBillSummary(data: DashboardSummary): BillSummary {
  const today = new Date().toISOString().split('T')[0];
  const statusMap: Record<string, { count: number; total: number }> = {};

  for (const bill of data.recentBills) {
    if (bill.status === 'paid' || bill.status === 'voided') continue;
    const effectiveStatus = bill.dueDate < today && bill.status !== 'draft' ? 'overdue' : bill.status;
    if (!statusMap[effectiveStatus]) statusMap[effectiveStatus] = { count: 0, total: 0 };
    statusMap[effectiveStatus].count++;
    statusMap[effectiveStatus].total += bill.amountDue;
  }

  const byStatus = ['draft', 'submitted', 'approved', 'overdue']
    .filter((s) => statusMap[s])
    .map((s) => ({
      status: s,
      label: STATUS_LABELS[s] ?? s,
      count: statusMap[s].count,
      total: statusMap[s].total,
    }));

  return {
    totalOutstanding: data.totalBillsToPay,
    totalOverdue: data.totalBillsOverdue,
    overdueCount: data.overdueBillCount,
    currency: 'NZD',
    byStatus,
  };
}

function deriveCashFlow(data: DashboardSummary): CashFlowMonth[] {
  return data.cashFlow.map((m) => ({
    month: formatMonthLabel(m.month),
    income: m.income,
    expenses: m.expenses,
  }));
}

function formatMonthLabel(monthStr: string): string {
  // monthStr is "YYYY-MM" format from API
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-NZ', { month: 'short' });
}

function deriveRecentActivity(data: DashboardSummary): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];

  for (const inv of data.recentInvoices) {
    items.push({
      id: `inv-${inv.id}`,
      date: inv.date,
      description: `Invoice ${inv.invoiceNumber ?? inv.id} to ${inv.contactName}`,
      amount: inv.total,
      currency: inv.currency,
      type: 'invoice_created',
    });
  }

  for (const bill of data.recentBills) {
    items.push({
      id: `bill-${bill.id}`,
      date: bill.date,
      description: `Bill ${bill.billNumber ?? bill.id} from ${bill.contactName}`,
      amount: -bill.total,
      currency: bill.currency,
      type: 'bill_created',
    });
  }

  for (const pmt of data.recentPayments) {
    const isReceived = pmt.invoiceId != null;
    items.push({
      id: `pmt-${pmt.id}`,
      date: pmt.date,
      description: isReceived
        ? `Payment received${pmt.reference ? ` — ${pmt.reference}` : ''}`
        : `Payment made${pmt.reference ? ` — ${pmt.reference}` : ''}`,
      amount: isReceived ? pmt.amount : -pmt.amount,
      currency: 'NZD',
      type: isReceived ? 'payment_received' : 'payment_made',
    });
  }

  // Sort by date descending, take latest 10
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items.slice(0, 10);
}

// ── Public hooks consumed by widgets ──

export function useInvoiceSummary() {
  const query = useDashboardSummary();
  return {
    ...query,
    data: query.data ? deriveInvoiceSummary(query.data) : undefined,
  };
}

export function useBillSummary() {
  const query = useDashboardSummary();
  return {
    ...query,
    data: query.data ? deriveBillSummary(query.data) : undefined,
  };
}

export function useBankAccounts() {
  const query = useDashboardSummary();
  return {
    ...query,
    data: query.data ? query.data.bankAccounts : undefined,
  };
}

export function useCashFlow() {
  const query = useDashboardSummary();
  return {
    ...query,
    data: query.data ? deriveCashFlow(query.data) : undefined,
  };
}

export function useRecentActivity() {
  const query = useDashboardSummary();
  return {
    ...query,
    data: query.data ? deriveRecentActivity(query.data) : undefined,
  };
}

// Re-export for backward compatibility
export type { ApiAccount };
