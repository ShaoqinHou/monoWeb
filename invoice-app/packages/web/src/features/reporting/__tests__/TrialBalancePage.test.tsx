// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TrialBalancePage } from '../routes/TrialBalancePage';
import type { TrialBalanceAccount } from '../components/TrialBalanceReport';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

const MOCK_ACCOUNTS: TrialBalanceAccount[] = [
  { accountCode: '200', accountName: 'Sales', accountType: 'revenue', debit: 0, credit: 50000 },
  { accountCode: '400', accountName: 'Rent', accountType: 'expense', debit: 12000, credit: 0 },
  { accountCode: '410', accountName: 'Wages', accountType: 'expense', debit: 20000, credit: 0 },
  { accountCode: '100', accountName: 'Bank Account', accountType: 'asset', debit: 30000, credit: 0 },
  { accountCode: '110', accountName: 'Accounts Receivable', accountType: 'asset', debit: 8000, credit: 0 },
  { accountCode: '300', accountName: 'Accounts Payable', accountType: 'liability', debit: 0, credit: 15000 },
  { accountCode: '500', accountName: 'Retained Earnings', accountType: 'equity', debit: 0, credit: 5000 },
];

function mockFetch() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ ok: true, data: MOCK_ACCOUNTS }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
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

describe('TrialBalancePage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = mockFetch();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the page title', () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Trial Balance');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders breadcrumbs', () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders the export button', () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Export report')).toBeInTheDocument();
  });

  it('renders the as-at date picker', () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('as-at-date-picker')).toBeInTheDocument();
    expect(screen.getByText('As at')).toBeInTheDocument();
  });

  it('calls the trial balance API with asAt param', async () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('/api/reports/trial-balance');
    expect(url).toContain('asAt=');
  });

  it('renders account type group headers', async () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Assets')).toBeInTheDocument();
    expect(screen.getByText('Liabilities')).toBeInTheDocument();
    expect(screen.getByText('Equity')).toBeInTheDocument();
  });

  it('renders account code and name columns', async () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders the table column headers', async () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Account Code')).toBeInTheDocument();
    });

    expect(screen.getByText('Account Name')).toBeInTheDocument();
    expect(screen.getByText('Debit')).toBeInTheDocument();
    expect(screen.getByText('Credit')).toBeInTheDocument();
  });

  it('renders the totals row', async () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  it('renders the trial-balance-report test id', async () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('trial-balance-report')).toBeInTheDocument();
    });
  });

  it('shows balanced state when debits equal credits', async () => {
    render(<TrialBalancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Balanced')).toBeInTheDocument();
    });
  });
});
