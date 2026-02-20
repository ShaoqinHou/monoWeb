// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BankReconciliationPage } from '../routes/BankPage';

// Mock TanStack Router — Link renders as a plain <a> with href
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
}));

const mockAccountsResponse = {
  ok: true,
  data: [
    { id: 'uuid-1', code: '1000', name: 'Business Cheque', type: 'asset', taxType: 'none', isArchived: false },
    { id: 'uuid-2', code: '1010', name: 'Savings Account', type: 'asset', taxType: 'none', isArchived: false },
    { id: 'uuid-3', code: '4000', name: 'Sales Revenue', type: 'revenue', taxType: 'output', isArchived: false },
  ],
};

const mockTransactionsResponse = {
  ok: true,
  data: [
    {
      id: 'bt-1', accountId: 'uuid-1', date: '2026-02-14', description: 'Payment In',
      reference: null, amount: 1500, isReconciled: false,
      matchedInvoiceId: null, matchedBillId: null, matchedPaymentId: null,
      category: null, createdAt: '2026-02-14T00:00:00Z',
    },
    {
      id: 'bt-2', accountId: 'uuid-1', date: '2026-02-13', description: 'Payment Out',
      reference: null, amount: -500, isReconciled: true,
      matchedInvoiceId: null, matchedBillId: 'bill-1', matchedPaymentId: null,
      category: null, createdAt: '2026-02-13T00:00:00Z',
    },
  ],
};

function mockFetchForUrl(url: string) {
  if (url === '/api/accounts') return mockAccountsResponse;
  if (url.startsWith('/api/bank-transactions')) return mockTransactionsResponse;
  return { ok: true, data: [] };
}

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn().mockImplementation((url: string) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => mockFetchForUrl(url),
    }),
  ) as unknown as typeof fetch;
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('BankReconciliationPage', () => {
  it('renders the page title "Bank accounts"', () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bank accounts');
  });

  it('renders breadcrumb navigation', () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    // "Bank accounts" appears in both heading and breadcrumb
    expect(screen.getAllByText('Bank accounts').length).toBeGreaterThan(0);
  });

  it('renders toolbar with Manage bank rules, Add bank account, and Additional actions', () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('bank-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('manage-bank-rules-link')).toHaveTextContent('Manage bank rules');
    expect(screen.getByTestId('add-bank-account-btn')).toHaveTextContent('Add bank account');
    expect(screen.getByTestId('additional-actions-btn')).toHaveTextContent('Additional actions');
  });

  it('renders bank overview section with action buttons', () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('bank-overview')).toBeInTheDocument();
    expect(screen.getByTestId('bank-actions')).toBeInTheDocument();
    expect(screen.getByTestId('action-spend')).toBeInTheDocument();
    expect(screen.getByTestId('action-receive')).toBeInTheDocument();
    expect(screen.getByTestId('action-transfer')).toBeInTheDocument();
    expect(screen.getByTestId('action-cash-coding')).toBeInTheDocument();
    expect(screen.getByTestId('action-report')).toBeInTheDocument();
  });

  it('action buttons link to correct routes', () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    const spendLink = screen.getByTestId('action-spend').closest('a');
    const receiveLink = screen.getByTestId('action-receive').closest('a');
    const transferLink = screen.getByTestId('action-transfer').closest('a');
    const cashCodingLink = screen.getByTestId('action-cash-coding').closest('a');
    const reportLink = screen.getByTestId('action-report').closest('a');

    expect(spendLink).toHaveAttribute('href', '/bank/spend');
    expect(receiveLink).toHaveAttribute('href', '/bank/receive');
    expect(transferLink).toHaveAttribute('href', '/bank/transfer');
    expect(cashCodingLink).toHaveAttribute('href', '/bank/cash-coding');
    expect(reportLink).toHaveAttribute('href', '/bank/reconciliation-report');
  });

  it('renders account summary cards after accounts load', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('account-cards')).toBeInTheDocument();
    });
    expect(screen.getByTestId('account-card-uuid-1')).toBeInTheDocument();
    expect(screen.getByTestId('account-card-uuid-2')).toBeInTheDocument();
  });

  it('renders account name as clickable link', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('account-name-link-uuid-1')).toBeInTheDocument();
    });
    const nameLink = screen.getByTestId('account-name-link-uuid-1');
    expect(nameLink).toHaveTextContent('Business Cheque');
    expect(nameLink.closest('a')).toHaveAttribute('href', '/bank');
  });

  it('renders account number on each card', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('account-number-uuid-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('account-number-uuid-1')).toHaveTextContent('1000');
    expect(screen.getByTestId('account-number-uuid-2')).toHaveTextContent('1010');
  });

  it('renders Manage menu toggle per account card', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('manage-menu-toggle-uuid-1')).toBeInTheDocument();
    });
    expect(screen.getByTestId('manage-menu-toggle-uuid-2')).toBeInTheDocument();
  });

  it('opens Manage dropdown when toggle clicked', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('manage-menu-toggle-uuid-1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('manage-menu-toggle-uuid-1'));
    expect(screen.getByTestId('manage-menu-uuid-1')).toBeInTheDocument();
  });

  it('renders "Reconcile X items" button per card', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('reconcile-btn-uuid-1')).toBeInTheDocument();
    });
    // First card is auto-selected, so it should show unmatched count
    expect(screen.getByTestId('reconcile-btn-uuid-1')).toHaveTextContent(/Reconcile \d+ items/);
  });

  it('renders balance table with "Balance in Xero" and "Statement balance" rows', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('balance-table-uuid-1')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Balance in Xero').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Statement balance').length).toBeGreaterThan(0);
  });

  it('renders reconciliation section', () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('bank-reconciliation-section')).toBeInTheDocument();
    expect(screen.getByText('Reconciliation')).toBeInTheDocument();
  });

  it('renders the bank account selector', () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('bank-account-selector')).toBeInTheDocument();
  });

  it('renders transaction list card after accounts load', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('bank-transaction-list')).toBeInTheDocument();
    });
  });

  it('fetches accounts from /api/accounts', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/accounts',
        expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) }),
      );
    });
  });

  it('filters to only asset-type accounts for display', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      // Asset accounts should appear (in both account cards and selector)
      expect(screen.getAllByText(/Business Cheque/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Savings Account/).length).toBeGreaterThan(0);
    });
    // Revenue account should NOT appear
    expect(screen.queryByText(/Sales Revenue/)).not.toBeInTheDocument();
  });

  it('auto-selects first account when loaded', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('uuid-1');
    });
  });

  it('shows no-accounts empty state when no asset accounts exist', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => {
          if (url === '/api/accounts') {
            return {
              ok: true,
              data: [
                { id: 'uuid-3', code: '4000', name: 'Sales Revenue', type: 'revenue', taxType: 'output', isArchived: false },
              ],
            };
          }
          return { ok: true, data: [] };
        },
      }),
    );

    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('no-accounts')).toBeInTheDocument();
    });
    expect(screen.getByText(/No bank accounts found/)).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: 'Server error' }),
    });

    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('accounts-error')).toBeInTheDocument();
    });
    expect(screen.getByText(/Failed to load bank accounts/)).toBeInTheDocument();
  });

  it('displays transaction count summary after load', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/unmatched of.*transactions/)).toBeInTheDocument();
    });
  });

  it('renders Import Transactions button', () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('import-btn')).toBeInTheDocument();
    expect(screen.getByText('Import Transactions')).toBeInTheDocument();
  });

  it('opens import dialog when Import button clicked', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });

    // Wait for accounts to load and button to be enabled
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue('uuid-1');
    });

    fireEvent.click(screen.getByTestId('import-btn'));
    await waitFor(() => {
      expect(screen.getByText('Import Bank Transactions')).toBeInTheDocument();
    });
  });

  it('shows statement balance when account selected and transactions loaded', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('statement-balance')).toBeInTheDocument();
    });
    expect(screen.getByText(/Computed Statement Balance/)).toBeInTheDocument();
  });

  it('shows unreconciled badge when there are unmatched transactions', async () => {
    render(<BankReconciliationPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('page-unreconciled-badge')).toBeInTheDocument();
    });
    expect(screen.getByText(/to reconcile/)).toBeInTheDocument();
  });
});
