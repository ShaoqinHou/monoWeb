// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvoicesOwedWidget } from '../components/InvoicesOwedWidget';
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
    totalInvoicesOwed: 18750,
    totalInvoicesOverdue: 4200,
    overdueInvoiceCount: 2,
    totalBillsToPay: 0,
    totalBillsOverdue: 0,
    overdueBillCount: 0,
    recentInvoices: [
      {
        id: 'inv-1', invoiceNumber: 'INV-001', contactName: 'Acme Corp',
        status: 'draft', total: 5250, amountDue: 5250, currency: 'NZD',
        date: '2026-02-15', dueDate: '2026-03-15', createdAt: '2026-02-15',
      },
      {
        id: 'inv-2', invoiceNumber: 'INV-002', contactName: 'Boom FM',
        status: 'submitted', total: 3800, amountDue: 3800, currency: 'NZD',
        date: '2026-02-14', dueDate: '2026-03-14', createdAt: '2026-02-14',
      },
      {
        id: 'inv-3', invoiceNumber: 'INV-003', contactName: 'City Agency',
        status: 'approved', total: 5500, amountDue: 5500, currency: 'NZD',
        date: '2026-02-13', dueDate: '2026-03-13', createdAt: '2026-02-13',
      },
      {
        id: 'inv-4', invoiceNumber: 'INV-004', contactName: 'Old Client',
        status: 'approved', total: 4200, amountDue: 4200, currency: 'NZD',
        date: '2026-01-01', dueDate: '2025-01-01', createdAt: '2025-01-01',
      },
    ],
    recentBills: [],
    recentPayments: [],
    bankAccounts: [],
    cashFlow: [],
    invoiceCount: 4,
    billCount: 0,
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

describe('InvoicesOwedWidget', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetchWith(makeSummary());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders the widget heading', async () => {
    render(<InvoicesOwedWidget />, { wrapper: createWrapper() });
    expect(screen.getByText('Invoices owed to you')).toBeInTheDocument();
  });

  it('renders total outstanding amount from API', async () => {
    render(<InvoicesOwedWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('$18,750.00')).toBeInTheDocument();
    });
  });

  it('renders status categories derived from API data', async () => {
    render(<InvoicesOwedWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('invoices-status-grid')).toBeInTheDocument();
    });

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Approval')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Payment')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders navigation links for each status', async () => {
    render(<InvoicesOwedWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('invoices-status-grid')).toBeInTheDocument();
    });

    const draftLink = screen.getByTestId('invoice-status-draft') as HTMLAnchorElement;
    expect(draftLink.tagName).toBe('A');
    expect(draftLink.getAttribute('href')).toBe('/sales/invoices?status=draft');
  });

  it('shows empty state when no invoices exist', async () => {
    globalThis.fetch = mockFetchWith(makeSummary({
      totalInvoicesOwed: 0,
      totalInvoicesOverdue: 0,
      overdueInvoiceCount: 0,
      recentInvoices: [],
      invoiceCount: 0,
    }));

    render(<InvoicesOwedWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('invoices-empty')).toBeInTheDocument();
    });
    expect(screen.getByText('No invoices yet')).toBeInTheDocument();
  });

  it('shows overdue banner with count and amount when overdue invoices exist', async () => {
    render(<InvoicesOwedWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('invoices-overdue-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/2 overdue/)).toBeInTheDocument();
    expect(screen.getByText('View aged receivables')).toBeInTheDocument();

    const banner = screen.getByTestId('invoices-overdue-banner') as HTMLAnchorElement;
    expect(banner.getAttribute('href')).toBe('/reporting/aged-receivables');
  });

  it('does not show overdue banner when no overdue invoices', async () => {
    globalThis.fetch = mockFetchWith(makeSummary({
      totalInvoicesOverdue: 0,
      overdueInvoiceCount: 0,
      recentInvoices: [
        {
          id: 'inv-1', invoiceNumber: 'INV-001', contactName: 'Acme Corp',
          status: 'draft', total: 5250, amountDue: 5250, currency: 'NZD',
          date: '2026-02-15', dueDate: '2026-03-15', createdAt: '2026-02-15',
        },
      ],
    }));

    render(<InvoicesOwedWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('invoices-status-grid')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('invoices-overdue-banner')).not.toBeInTheDocument();
  });
});
