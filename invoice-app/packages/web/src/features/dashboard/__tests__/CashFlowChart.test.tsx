// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DashboardSummary } from '../types';

// Mock recharts to avoid ResizeObserver + SVG issues in jsdom
vi.mock('recharts', () => {
  const MockResponsiveContainer = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-responsive-container">{children}</div>
  );
  const MockBarChart = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-bar-chart">{children}</div>
  );
  const MockBar = () => <div />;
  const MockXAxis = () => <div />;
  const MockYAxis = () => <div />;
  const MockTooltip = () => <div />;
  const MockLegend = () => <div />;

  return {
    ResponsiveContainer: MockResponsiveContainer,
    BarChart: MockBarChart,
    Bar: MockBar,
    XAxis: MockXAxis,
    YAxis: MockYAxis,
    Tooltip: MockTooltip,
    Legend: MockLegend,
  };
});

import { CashFlowChart } from '../components/CashFlowChart';

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
    bankAccounts: [],
    cashFlow: [
      { month: '2026-01', income: 26000, expenses: 20000 },
      { month: '2026-02', income: 29000, expenses: 22500 },
    ],
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

describe('CashFlowChart', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetchWith(makeSummary());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders the widget heading', async () => {
    render(<CashFlowChart />, { wrapper: createWrapper() });
    expect(screen.getByText('Cash In / Out')).toBeInTheDocument();
  });

  it('renders the chart container after loading', async () => {
    render(<CashFlowChart />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('cashflow-chart')).toBeInTheDocument();
    });
  });

  it('chart container has correct height class', async () => {
    render(<CashFlowChart />, { wrapper: createWrapper() });

    await waitFor(() => {
      const container = screen.getByTestId('cashflow-chart');
      expect(container.className).toContain('h-64');
    });
  });

  it('renders the mocked recharts bar chart', async () => {
    render(<CashFlowChart />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('mock-responsive-container')).toBeInTheDocument();
    });
    expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
  });

  it('shows empty state when all cash flow values are zero', async () => {
    globalThis.fetch = mockFetchWith(makeSummary({
      cashFlow: [
        { month: '2026-01', income: 0, expenses: 0 },
        { month: '2026-02', income: 0, expenses: 0 },
      ],
    }));

    render(<CashFlowChart />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('cashflow-empty')).toBeInTheDocument();
    });
    expect(screen.getByText('No cash flow data yet')).toBeInTheDocument();
  });

  it('shows empty state when cash flow array is empty', async () => {
    globalThis.fetch = mockFetchWith(makeSummary({ cashFlow: [] }));

    render(<CashFlowChart />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('cashflow-empty')).toBeInTheDocument();
    });
  });
});
