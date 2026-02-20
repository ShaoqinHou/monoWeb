// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-barchart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-linechart">{children}</div>,
  Line: () => <div />,
}));

// Mock @shared/calc/currency
vi.mock('@shared/calc/currency', () => ({
  formatCurrency: (val: number, _currency?: string) => `$${val.toFixed(2)}`,
}));

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// ── ExpensesToReviewWidget ──

describe('ExpensesToReviewWidget', () => {
  it('renders expense summary and by-user table', async () => {
    const { ExpensesToReviewWidget } = await import('../components/ExpensesToReviewWidget');
    render(<ExpensesToReviewWidget />);

    expect(screen.getByText('Expenses to review')).toBeInTheDocument();
    expect(screen.getByTestId('expenses-summary')).toBeInTheDocument();
    expect(screen.getByTestId('expenses-by-user')).toBeInTheDocument();
    expect(screen.getByText('to review')).toBeInTheDocument();
    expect(screen.getByText('to pay')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
  });
});

// ── CashFlowChart enhancements ──

describe('CashFlowChart toggle and totals', () => {
  beforeAll(() => {
    vi.mock('../hooks/useDashboardData', () => ({
      useCashFlow: () => ({
        data: [
          { month: 'Jan', income: 5000, expenses: 3000 },
          { month: 'Feb', income: 6000, expenses: 4000 },
        ],
        isLoading: false,
      }),
      useBankAccounts: () => ({
        data: [{ id: '1', name: 'Checking', code: '1000', type: 'bank' }],
        isLoading: false,
      }),
      useInvoiceSummary: () => ({
        data: {
          totalOutstanding: 5000,
          totalOverdue: 1000,
          overdueCount: 2,
          currency: 'NZD',
          byStatus: [],
        },
        isLoading: false,
      }),
      useBillSummary: () => ({
        data: {
          totalOutstanding: 3000,
          totalOverdue: 500,
          overdueCount: 1,
          currency: 'NZD',
          byStatus: [],
        },
        isLoading: false,
      }),
    }));
  });

  it('shows toggle button and totals row', async () => {
    const { CashFlowChart } = await import('../components/CashFlowChart');
    render(<CashFlowChart />);

    expect(screen.getByTestId('cashflow-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('cashflow-totals')).toBeInTheDocument();
    expect(screen.getByTestId('cashflow-total-in')).toBeInTheDocument();
    expect(screen.getByTestId('cashflow-total-out')).toBeInTheDocument();
    expect(screen.getByTestId('cashflow-total-diff')).toBeInTheDocument();
  });

  it('hides chart when toggle clicked', async () => {
    const { CashFlowChart } = await import('../components/CashFlowChart');
    render(<CashFlowChart />);

    fireEvent.click(screen.getByTestId('cashflow-toggle'));
    expect(screen.getByTestId('cashflow-hidden')).toBeInTheDocument();
    expect(screen.getByText('Chart hidden')).toBeInTheDocument();
  });
});

// ── ProfitLossChart YTD ──

describe('ProfitLossChart YTD metrics', () => {
  it('shows YTD amount and change percentage', async () => {
    const { ProfitLossChart } = await import('../components/ProfitLossChart');
    render(<ProfitLossChart />);

    expect(screen.getByTestId('profit-loss-ytd')).toBeInTheDocument();
    expect(screen.getByTestId('profit-loss-ytd-amount')).toBeInTheDocument();
    expect(screen.getByTestId('profit-loss-change-pct')).toBeInTheDocument();
  });
});

// ── AccountWatchlist YTD ──

describe('AccountWatchlist with YTD columns', () => {
  it('renders This Month and YTD column headers', async () => {
    const { AccountWatchlist } = await import('../components/AccountWatchlist');
    render(<AccountWatchlist />);

    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('YTD')).toBeInTheDocument();
    expect(screen.getByText('Account Watchlist')).toBeInTheDocument();
  });
});

// ── BankAccountsWidget enhanced ──

describe('BankAccountsWidget enhanced with balances', () => {
  it('renders statement vs xero balance and import button', async () => {
    const { BankAccountsWidget } = await import('../components/BankAccountsWidget');
    render(<BankAccountsWidget />);

    expect(screen.getByText('Statement')).toBeInTheDocument();
    expect(screen.getByText('In Xero')).toBeInTheDocument();
    expect(screen.getByText('Difference')).toBeInTheDocument();
  });
});
