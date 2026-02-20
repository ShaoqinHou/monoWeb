// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../routes/DashboardPage';
import type { DashboardSummary } from '../types';

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
  useNavigate: () => vi.fn(),
}));

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => {
  const MockResponsiveContainer = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-responsive-container">{children}</div>
  );
  const MockBarChart = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-bar-chart">{children}</div>
  );
  const MockLineChart = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-line-chart">{children}</div>
  );
  const MockBar = () => <div />;
  const MockLine = () => <div />;
  const MockXAxis = () => <div />;
  const MockYAxis = () => <div />;
  const MockTooltip = () => <div />;
  const MockLegend = () => <div />;

  return {
    ResponsiveContainer: MockResponsiveContainer,
    BarChart: MockBarChart,
    LineChart: MockLineChart,
    Bar: MockBar,
    Line: MockLine,
    XAxis: MockXAxis,
    YAxis: MockYAxis,
    Tooltip: MockTooltip,
    Legend: MockLegend,
  };
});

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
        contactName: 'Ridgeway University',
        status: 'draft',
        total: 5250,
        amountDue: 5250,
        currency: 'NZD',
        date: '2026-02-15',
        dueDate: '2026-03-15',
        createdAt: '2026-02-15',
      },
    ],
    recentBills: [
      {
        id: 'bill-1',
        billNumber: 'BILL-001',
        contactName: 'PowerDirect',
        status: 'approved',
        total: 890,
        amountDue: 890,
        currency: 'NZD',
        date: '2026-02-12',
        dueDate: '2026-03-12',
        createdAt: '2026-02-12',
      },
    ],
    recentPayments: [
      {
        id: 'pmt-1',
        amount: 6250,
        date: '2026-02-15',
        reference: 'RU-2026',
        invoiceId: 'inv-1',
        billId: null,
        createdAt: '2026-02-15',
      },
    ],
    bankAccounts: [
      { id: 'acc-1', code: '1-0100', name: 'Business Checking', type: 'asset', description: null },
      { id: 'acc-2', code: '1-0200', name: 'Business Savings', type: 'asset', description: null },
    ],
    cashFlow: [
      { month: '2026-01', income: 26000, expenses: 20000 },
      { month: '2026-02', income: 29000, expenses: 22500 },
    ],
    invoiceCount: 5,
    billCount: 3,
    ...overrides,
  };
}

const MOCK_TASKS = {
  overdueInvoices: { count: 2, total: 4200 },
  billsDueThisWeek: { count: 1, total: 890 },
  unreconciledTransactions: { count: 5 },
  unapprovedExpenses: { count: 0 },
  pendingLeaveRequests: { count: 0 },
};

const MOCK_INSIGHTS = {
  revenue: { thisMonth: 29000, lastMonth: 26000, changePercent: 11.5 },
  expenses: { thisMonth: 22500, lastMonth: 20000, changePercent: 12.5 },
  cashPosition: 45000,
  bankAccountCount: 2,
  topDebtors: [{ name: 'Ridgeway University', total: 5250 }],
};

function mockFetchWith(data: DashboardSummary) {
  return vi.fn().mockImplementation((url: string) => {
    let responseData: unknown = data;
    if (typeof url === 'string' && url.includes('/dashboard/tasks')) {
      responseData = MOCK_TASKS;
    } else if (typeof url === 'string' && url.includes('/dashboard/insights')) {
      responseData = MOCK_INSIGHTS;
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true, data: responseData }),
    });
  });
}

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

describe('DashboardPage', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetchWith(makeSummary());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders the page title "Business Overview"', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Business Overview');
  });

  it('renders "Edit homepage" ghost button', () => {
    render(<DashboardPage />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: 'Edit homepage' })).toBeInTheDocument();
  });

  it('has aria description on widgets grid', () => {
    render(<DashboardPage />, { wrapper: createWrapper() });
    const grid = document.querySelector('[aria-description="Dashboard of 10 widgets"]');
    expect(grid).toBeInTheDocument();
  });

  it('calls the dashboard summary API', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/dashboard/summary',
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });
  });

  it('renders quick action buttons on the dashboard', () => {
    render(<DashboardPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
  });

  it('renders all widget sections after data loads', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Bank Accounts')).toBeInTheDocument();
    });

    expect(screen.getByText('Invoices owed to you')).toBeInTheDocument();
    expect(screen.getByText('Bills you need to pay')).toBeInTheDocument();
    expect(screen.getByText('Cash In / Out')).toBeInTheDocument();
    expect(screen.getByText('Profit & Loss')).toBeInTheDocument();
    expect(screen.getByText('Account Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('renders bank account names from API data', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Account names appear in both BankAccountsWidget and AccountWatchlist
      expect(screen.getAllByText('Business Checking').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Business Savings').length).toBeGreaterThan(0);
  });

  it('renders quick action new invoice button', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('quick-action-new-invoice')).toBeInTheDocument();
  });

  it('renders quick action buttons', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-new-invoice')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-new-bill')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-new-contact')).toBeInTheDocument();
    expect(screen.getByTestId('quick-action-record-payment')).toBeInTheDocument();
  });
});
