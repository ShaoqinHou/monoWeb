// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillsToPayWidget } from '../components/BillsToPayWidget';
import type { DashboardSummary } from '../types';

// Recharts needs ResizeObserver in jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock TanStack Router — Link renders as a plain <a> with href
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, search, children, ...rest }: Record<string, unknown>) => {
    let href = to as string;
    if (search && typeof search === 'object') {
      const params = new URLSearchParams(search as Record<string, string>);
      href = `${href}?${params.toString()}`;
    }
    return <a href={href} {...rest}>{children as React.ReactNode}</a>;
  },
}));

function makeSummary(overrides?: Partial<DashboardSummary>): DashboardSummary {
  return {
    totalInvoicesOwed: 0,
    totalInvoicesOverdue: 0,
    overdueInvoiceCount: 0,
    totalBillsToPay: 12350,
    totalBillsOverdue: 2800,
    overdueBillCount: 2,
    recentInvoices: [],
    recentBills: [
      {
        id: 'bill-1', billNumber: 'BILL-001', contactName: 'Supplies Co',
        status: 'draft', total: 3100, amountDue: 3100, currency: 'NZD',
        date: '2026-02-10', dueDate: '2026-03-10', createdAt: '2026-02-10',
      },
      {
        id: 'bill-2', billNumber: 'BILL-002', contactName: 'PowerDirect',
        status: 'approved', total: 5000, amountDue: 5000, currency: 'NZD',
        date: '2026-02-05', dueDate: '2026-03-05', createdAt: '2026-02-05',
      },
      {
        id: 'bill-3', billNumber: 'BILL-003', contactName: 'Old Vendor',
        status: 'approved', total: 2800, amountDue: 2800, currency: 'NZD',
        date: '2025-12-01', dueDate: '2025-01-01', createdAt: '2025-12-01',
      },
    ],
    recentPayments: [],
    bankAccounts: [],
    cashFlow: [],
    invoiceCount: 0,
    billCount: 3,
    ...overrides,
  };
}

function mockFetchWith(data: DashboardSummary) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ ok: true, data }),
  });
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('BillsToPayWidget', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetchWith(makeSummary());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders the widget heading', async () => {
    render(<BillsToPayWidget />, { wrapper: createWrapper() });
    expect(screen.getByText('Bills you need to pay')).toBeInTheDocument();
  });

  it('renders total outstanding amount from API', async () => {
    render(<BillsToPayWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('$12,350.00')).toBeInTheDocument();
    });
  });

  it('renders status categories derived from API data', async () => {
    render(<BillsToPayWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('bills-status-grid')).toBeInTheDocument();
    });

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders navigation links for each status', async () => {
    render(<BillsToPayWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('bills-status-grid')).toBeInTheDocument();
    });

    const draftLink = screen.getByTestId('bill-status-draft') as HTMLAnchorElement;
    expect(draftLink.tagName).toBe('A');
    expect(draftLink.getAttribute('href')).toBe('/purchases/bills?status=draft');
  });

  it('shows empty state when no bills exist', async () => {
    globalThis.fetch = mockFetchWith(makeSummary({
      totalBillsToPay: 0,
      totalBillsOverdue: 0,
      overdueBillCount: 0,
      recentBills: [],
      billCount: 0,
    }));

    render(<BillsToPayWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('bills-empty')).toBeInTheDocument();
    });
    expect(screen.getByText('No bills yet')).toBeInTheDocument();
  });

  it('shows overdue banner with count and amount when overdue bills exist', async () => {
    render(<BillsToPayWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('bills-overdue-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/2 overdue/)).toBeInTheDocument();
    expect(screen.getByText('View aged payables')).toBeInTheDocument();

    const banner = screen.getByTestId('bills-overdue-banner') as HTMLAnchorElement;
    expect(banner.getAttribute('href')).toBe('/reporting/aged-payables');
  });

  it('does not show overdue banner when no overdue bills', async () => {
    globalThis.fetch = mockFetchWith(makeSummary({
      totalBillsOverdue: 0,
      overdueBillCount: 0,
      recentBills: [
        {
          id: 'bill-1', billNumber: 'BILL-001', contactName: 'Supplies Co',
          status: 'draft', total: 3100, amountDue: 3100, currency: 'NZD',
          date: '2026-02-10', dueDate: '2026-03-10', createdAt: '2026-02-10',
        },
      ],
    }));

    render(<BillsToPayWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('bills-status-grid')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('bills-overdue-banner')).not.toBeInTheDocument();
  });
});
