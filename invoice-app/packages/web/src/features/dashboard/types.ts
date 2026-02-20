// Dashboard-specific types

// ── API response shape from /api/dashboard/summary ──

export interface DashboardSummary {
  totalInvoicesOwed: number;
  totalInvoicesOverdue: number;
  overdueInvoiceCount: number;
  totalBillsToPay: number;
  totalBillsOverdue: number;
  overdueBillCount: number;
  recentInvoices: ApiInvoice[];
  recentBills: ApiBill[];
  recentPayments: ApiPayment[];
  bankAccounts: ApiAccount[];
  cashFlow: CashFlowMonth[];
  invoiceCount: number;
  billCount: number;
}

export interface ApiInvoice {
  id: string;
  invoiceNumber: string | null;
  contactName: string;
  status: string;
  total: number;
  amountDue: number;
  currency: string;
  date: string;
  dueDate: string;
  createdAt: string;
}

export interface ApiBill {
  id: string;
  billNumber: string | null;
  contactName: string;
  status: string;
  total: number;
  amountDue: number;
  currency: string;
  date: string;
  dueDate: string;
  createdAt: string;
}

export interface ApiPayment {
  id: string;
  amount: number;
  date: string;
  reference: string | null;
  invoiceId: string | null;
  billId: string | null;
  createdAt: string;
}

export interface ApiAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
}

// ── Derived UI types ──

export interface BankAccountSummary {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  currency: string;
}

export interface StatusBreakdown {
  status: string;
  label: string;
  count: number;
  total: number;
}

export interface InvoiceSummary {
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  currency: string;
  byStatus: StatusBreakdown[];
}

export interface BillSummary {
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  currency: string;
  byStatus: StatusBreakdown[];
}

export interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
}

export interface RecentActivityItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: 'payment_received' | 'payment_made' | 'invoice_created' | 'bill_created';
}

// ── Dashboard Tasks (actionable items) ──

export interface DashboardTaskCount {
  count: number;
  total?: number;
}

export interface DashboardTasks {
  overdueInvoices: DashboardTaskCount;
  billsDueThisWeek: DashboardTaskCount;
  unreconciledTransactions: { count: number };
  unapprovedExpenses: { count: number };
  pendingLeaveRequests: { count: number };
}

// ── Dashboard Insights ──

export interface TrendMetric {
  thisMonth: number;
  lastMonth: number;
  changePercent: number;
}

export interface Debtor {
  name: string;
  total: number;
}

export interface DashboardInsights {
  revenue: TrendMetric;
  expenses: TrendMetric;
  cashPosition: number;
  bankAccountCount: number;
  topDebtors: Debtor[];
}
