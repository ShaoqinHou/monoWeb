// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickActions } from '../components/QuickActions';
import type { DashboardSummary } from '../types';

// Mock TanStack Router — Link renders as a plain <a> with href
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
}));

function makeSummary(overrides?: Partial<DashboardSummary>): DashboardSummary {
  return {
    totalInvoicesOwed: 18750,
    totalInvoicesOverdue: 4200,
    overdueInvoiceCount: 2,
    totalBillsToPay: 12350,
    totalBillsOverdue: 2800,
    overdueBillCount: 2,
    recentInvoices: [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        contactName: 'Acme Corp',
        status: 'approved',
        total: 5250,
        amountDue: 5250,
        currency: 'NZD',
        date: '2026-02-15',
        dueDate: '2026-03-15',
        createdAt: '2026-02-15',
      },
    ],
    recentBills: [],
    recentPayments: [],
    bankAccounts: [],
    cashFlow: [],
    invoiceCount: 1,
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

describe('QuickActions', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetchWith(makeSummary());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders all four quick action buttons', () => {
    render(<QuickActions />, { wrapper: createWrapper() });

    expect(screen.getByTestId('quick-action-new-invoice')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-new-bill')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-new-contact')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-record-payment')).toBeInTheDocument();
  });

  it('New Invoice links to /sales/invoices/new', () => {
    render(<QuickActions />, { wrapper: createWrapper() });
    const link = screen.getByTestId('quick-action-new-invoice') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/sales/invoices/new');
  });

  it('New Bill links to /purchases/bills/new', () => {
    render(<QuickActions />, { wrapper: createWrapper() });
    const link = screen.getByTestId('quick-action-new-bill') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/purchases/bills/new');
  });

  it('New Contact links to /contacts/new', () => {
    render(<QuickActions />, { wrapper: createWrapper() });
    const link = screen.getByTestId('quick-action-new-contact') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/contacts/new');
  });

  it('Record Payment links to the first unpaid invoice', async () => {
    render(<QuickActions />, { wrapper: createWrapper() });

    await waitFor(() => {
      const link = screen.getByTestId('quick-action-record-payment') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/sales/invoices/inv-1/payment');
    });
  });

  it('Record Payment falls back to /sales/invoices when all invoices paid', async () => {
    globalThis.fetch = mockFetchWith(makeSummary({
      recentInvoices: [
        {
          id: 'inv-paid',
          invoiceNumber: 'INV-099',
          contactName: 'Done Co',
          status: 'paid',
          total: 1000,
          amountDue: 0,
          currency: 'NZD',
          date: '2026-02-01',
          dueDate: '2026-03-01',
          createdAt: '2026-02-01',
        },
      ],
    }));

    render(<QuickActions />, { wrapper: createWrapper() });

    await waitFor(() => {
      const link = screen.getByTestId('quick-action-record-payment') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/sales/invoices');
    });
  });
});
