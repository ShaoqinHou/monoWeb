// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../lib/api-helpers', () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiFetch, apiPost } from '../../lib/api-helpers';
import { useDashboardSummary, useInvoiceSummary, useBillSummary } from '../../features/dashboard/hooks/useDashboardData';
import { useContactActivity, useContactFinancialSummary } from '../../features/contacts/hooks/useContacts';
import { useProfitAndLoss } from '../../features/reporting/hooks/useReports';
import { useAuditEntries } from '../../features/audit/hooks/useAudit';

const mockedApiFetch = vi.mocked(apiFetch);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Cross-Feature Integration', () => {
  const dashboardSummary = {
    totalInvoicesOwed: 5000,
    totalInvoicesOverdue: 1500,
    overdueInvoiceCount: 3,
    totalBillsToPay: 3000,
    totalBillsOverdue: 800,
    overdueBillCount: 2,
    recentInvoices: [
      { id: 'inv-1', invoiceNumber: 'INV-001', contactName: 'Acme Corp', status: 'approved', total: 2000, amountDue: 2000, currency: 'NZD', date: '2026-02-01', dueDate: '2025-12-01', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'inv-2', invoiceNumber: 'INV-002', contactName: 'Beta Ltd', status: 'approved', total: 1500, amountDue: 1500, currency: 'NZD', date: '2026-02-05', dueDate: '2025-12-15', createdAt: '2026-02-05T00:00:00Z' },
      { id: 'inv-3', invoiceNumber: 'INV-003', contactName: 'Gamma Inc', status: 'approved', total: 1500, amountDue: 1500, currency: 'NZD', date: '2026-02-10', dueDate: '2025-11-30', createdAt: '2026-02-10T00:00:00Z' },
      { id: 'inv-4', invoiceNumber: 'INV-004', contactName: 'Delta Co', status: 'draft', total: 800, amountDue: 800, currency: 'NZD', date: '2026-02-12', dueDate: '2026-03-12', createdAt: '2026-02-12T00:00:00Z' },
    ],
    recentBills: [
      { id: 'bill-1', billNumber: 'BILL-001', contactName: 'Supplier A', status: 'approved', total: 1200, amountDue: 1200, currency: 'NZD', date: '2026-02-01', dueDate: '2025-12-01', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'bill-2', billNumber: 'BILL-002', contactName: 'Supplier B', status: 'approved', total: 1800, amountDue: 1800, currency: 'NZD', date: '2026-02-05', dueDate: '2026-03-05', createdAt: '2026-02-05T00:00:00Z' },
    ],
    recentPayments: [
      { id: 'pmt-1', amount: 500, date: '2026-02-01', reference: 'CHQ-001', invoiceId: 'inv-1', billId: null, createdAt: '2026-02-01T00:00:00Z' },
    ],
    bankAccounts: [
      { id: 'acc-1', code: '1000', name: 'Main Checking', type: 'asset', description: null },
    ],
    cashFlow: [
      { month: '2026-01', income: 15000, expenses: 10000 },
      { month: '2026-02', income: 18000, expenses: 12000 },
    ],
    invoiceCount: 4,
    billCount: 2,
  };

  it('dashboard shows correct overdue invoice count', async () => {
    mockedApiFetch.mockResolvedValueOnce(dashboardSummary);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInvoiceSummary(), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    // All invoices with past dueDate and not draft/paid/voided count as overdue
    expect(result.current.data!.overdueCount).toBe(3);
    expect(result.current.data!.totalOverdue).toBe(1500);
  });

  it('dashboard shows correct bills due amount', async () => {
    mockedApiFetch.mockResolvedValueOnce(dashboardSummary);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBillSummary(), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data!.totalOutstanding).toBe(3000);
    expect(result.current.data!.totalOverdue).toBe(800);
    expect(result.current.data!.overdueCount).toBe(2);
  });

  it('contact detail shows linked invoices and bills', async () => {
    const contactId = 'c-acme';

    const invoices = [
      { id: 'inv-1', invoiceNumber: 'INV-001', contactId: 'c-acme', contactName: 'Acme Corp', status: 'approved', total: 2000, amountDue: 2000, amountPaid: 0, date: '2026-02-01', dueDate: '2026-03-01', currency: 'NZD', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
      { id: 'inv-2', invoiceNumber: 'INV-002', contactId: 'c-other', contactName: 'Other Co', status: 'paid', total: 500, amountDue: 0, amountPaid: 500, date: '2026-01-15', dueDate: '2026-02-15', currency: 'NZD', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z' },
      { id: 'inv-3', invoiceNumber: 'INV-003', contactId: 'c-acme', contactName: 'Acme Corp', status: 'paid', total: 1000, amountDue: 0, amountPaid: 1000, date: '2026-01-01', dueDate: '2026-02-01', currency: 'NZD', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
    ];

    const bills = [
      { id: 'bill-1', billNumber: 'BILL-001', contactId: 'c-acme', contactName: 'Acme Corp', status: 'approved', total: 800, amountDue: 800, amountPaid: 0, date: '2026-02-01', dueDate: '2026-03-01', currency: 'NZD', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
    ];

    // useContactInvoices and useContactBills both call apiFetch('/invoices') and apiFetch('/bills')
    // useContactActivity calls both hooks
    mockedApiFetch.mockResolvedValueOnce(invoices); // for invoices
    mockedApiFetch.mockResolvedValueOnce(bills); // for bills

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContactActivity(contactId), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Should only show activities for the specified contact
    expect(result.current.data.length).toBe(3); // 2 invoices + 1 bill for c-acme
    expect(result.current.data.some((a) => a.type === 'invoice')).toBe(true);
    expect(result.current.data.some((a) => a.type === 'bill')).toBe(true);

    // Sorted by date descending
    const dates = result.current.data.map((a) => a.date);
    for (let i = 1; i < dates.length; i++) {
      expect(new Date(dates[i - 1]).getTime()).toBeGreaterThanOrEqual(new Date(dates[i]).getTime());
    }
  });

  it('contact financial summary shows correct totals', async () => {
    const contactId = 'c-acme';

    const invoices = [
      { id: 'inv-1', invoiceNumber: 'INV-001', contactId: 'c-acme', contactName: 'Acme', status: 'approved', total: 2000, amountDue: 2000, amountPaid: 0, date: '2026-02-01', dueDate: '2026-03-01', currency: 'NZD', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
      { id: 'inv-2', invoiceNumber: 'INV-002', contactId: 'c-acme', contactName: 'Acme', status: 'paid', total: 1000, amountDue: 0, amountPaid: 1000, date: '2026-01-01', dueDate: '2026-02-01', currency: 'NZD', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
    ];

    const bills = [
      { id: 'bill-1', billNumber: 'BILL-001', contactId: 'c-acme', contactName: 'Acme', status: 'approved', total: 500, amountDue: 500, amountPaid: 0, date: '2026-02-01', dueDate: '2026-03-01', currency: 'NZD', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
    ];

    mockedApiFetch.mockResolvedValueOnce(invoices);
    mockedApiFetch.mockResolvedValueOnce(bills);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useContactFinancialSummary(contactId), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.totalInvoiced).toBe(3000); // 2000 + 1000
    expect(result.current.data.totalBilled).toBe(500);
    expect(result.current.data.outstanding).toBe(2000); // only approved inv with amountDue > 0
  });

  it('reporting P&L returns structured data', async () => {
    const plReport = {
      dateRange: { from: '2026-01-01', to: '2026-02-28' },
      basis: 'accrual',
      revenue: [{ name: 'Sales', amount: 45000 }, { name: 'Other', amount: 5000 }],
      costOfSales: [],
      operatingExpenses: [{ name: 'Salaries', amount: 20000 }, { name: 'Rent', amount: 10000 }],
      grossProfit: 50000,
      netProfit: 20000,
      totalRevenue: 50000,
      totalCostOfSales: 0,
      totalOperatingExpenses: 30000,
    };

    mockedApiFetch.mockResolvedValueOnce(plReport);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useProfitAndLoss({ from: '2026-01-01', to: '2026-02-28' }, 'accrual'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.netProfit).toBe(20000);
    expect(result.current.data!.totalRevenue).toBe(50000);
    expect(result.current.data!.totalOperatingExpenses).toBe(30000);
  });

  it('audit trail records entries with correct entity type filtering', async () => {
    // The useAuditEntries hook uses a custom fetch (not apiFetch) that unwraps { ok, data, total }
    // We need to mock the global fetch for this one
    const auditEntries = [
      { id: 'aud-1', entityType: 'invoice', entityId: 'inv-1', action: 'created', userId: 'user-1', userName: 'Admin', details: null, timestamp: '2026-02-01T10:00:00Z' },
      { id: 'aud-2', entityType: 'invoice', entityId: 'inv-1', action: 'approved', userId: 'user-1', userName: 'Admin', details: null, timestamp: '2026-02-01T11:00:00Z' },
    ];

    // Mock the global fetch (useAuditEntries uses fetch directly, not apiFetch)
    const mockFetchResponse = {
      ok: true,
      json: () => Promise.resolve({ ok: true, data: auditEntries, total: 2 }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockFetchResponse as Response);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useAuditEntries({ entityType: 'invoice' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.entries).toHaveLength(2);
    expect(result.current.data!.total).toBe(2);
    expect(result.current.data!.entries[0].entityType).toBe('invoice');
  });

  it('dashboard full summary contains all fields', async () => {
    mockedApiFetch.mockResolvedValueOnce(dashboardSummary);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDashboardSummary(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data.totalInvoicesOwed).toBe(5000);
    expect(data.totalBillsToPay).toBe(3000);
    expect(data.recentInvoices).toHaveLength(4);
    expect(data.recentBills).toHaveLength(2);
    expect(data.recentPayments).toHaveLength(1);
    expect(data.bankAccounts).toHaveLength(1);
    expect(data.cashFlow).toHaveLength(2);
    expect(data.invoiceCount).toBe(4);
    expect(data.billCount).toBe(2);
  });

  it('invoice summary derives correct status breakdown', async () => {
    mockedApiFetch.mockResolvedValueOnce(dashboardSummary);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useInvoiceSummary(), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    const summary = result.current.data!;
    expect(summary.currency).toBe('NZD');

    // Check that byStatus has the expected breakdown
    // 3 overdue (past dueDate + approved status), 1 draft
    const overdue = summary.byStatus.find((s) => s.status === 'overdue');
    const draft = summary.byStatus.find((s) => s.status === 'draft');

    expect(overdue).toMatchObject({ count: 3 });

    expect(draft).toMatchObject({ count: 1, total: 800 });
  });
});
