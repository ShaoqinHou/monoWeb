// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BankAccountsWidget } from '../components/BankAccountsWidget';
import type { DashboardSummary } from '../types';

function makeSummary(overrides?: Partial<DashboardSummary>): DashboardSummary {
  return {
    totalInvoicesOwed: 0,
    totalInvoicesOverdue: 0,
    overdueInvoiceCount: 0,
    totalBillsToPay: 0,
    totalBillsOverdue: 0,
    overdueBillCount: 0,
    recentInvoices: [],
    recentBills: [],
    recentPayments: [],
    bankAccounts: [
      { id: 'acc-1', code: '1-0100', name: 'Business Checking', type: 'asset', description: null },
      { id: 'acc-2', code: '1-0200', name: 'Business Savings', type: 'asset', description: null },
    ],
    cashFlow: [],
    invoiceCount: 0,
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

describe('BankAccountsWidget', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetchWith(makeSummary());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders the widget heading', async () => {
    render(<BankAccountsWidget />, { wrapper: createWrapper() });
    expect(screen.getByText('Bank Accounts')).toBeInTheDocument();
  });

  it('renders bank account names from API', async () => {
    render(<BankAccountsWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Business Checking')).toBeInTheDocument();
    });
    expect(screen.getByText('Business Savings')).toBeInTheDocument();
  });

  it('renders account codes', async () => {
    render(<BankAccountsWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('1-0100')).toBeInTheDocument();
    });
    expect(screen.getByText('1-0200')).toBeInTheDocument();
  });

  it('renders the bank accounts list with correct count', async () => {
    render(<BankAccountsWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('bank-accounts-list')).toBeInTheDocument();
    });

    const listItems = screen.getByTestId('bank-accounts-list').querySelectorAll('li');
    expect(listItems).toHaveLength(2);
  });

  it('shows empty state when no bank accounts', async () => {
    globalThis.fetch = mockFetchWith(makeSummary({ bankAccounts: [] }));

    render(<BankAccountsWidget />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('bank-accounts-empty')).toBeInTheDocument();
    });
    expect(screen.getByText('No bank accounts')).toBeInTheDocument();
  });
});
