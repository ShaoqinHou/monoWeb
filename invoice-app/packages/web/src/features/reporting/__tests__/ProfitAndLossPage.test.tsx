// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfitAndLossPage } from '../routes/ProfitAndLossPage';
import type { ProfitAndLossReport } from '../types';

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const MOCK_PNL: ProfitAndLossReport = {
  dateRange: { from: '2026-01-01', to: '2026-12-31' },
  revenue: [
    { accountName: 'Sales', amount: 45000 },
    { accountName: 'Other Revenue', amount: 2000 },
  ],
  costOfSales: [
    { accountName: 'Cost of Goods Sold', amount: 15000 },
  ],
  operatingExpenses: [
    { accountName: 'Advertising', amount: 3200 },
    { accountName: 'Office Expenses', amount: 1800 },
    { accountName: 'Rent', amount: 6000 },
    { accountName: 'Wages and Salaries', amount: 12000 },
  ],
  totalRevenue: 47000,
  totalCostOfSales: 15000,
  grossProfit: 32000,
  totalOperatingExpenses: 23000,
  netProfit: 9000,
};

function mockFetch() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ ok: true, data: MOCK_PNL }), {
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

describe('ProfitAndLossPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = mockFetch();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the page title in the header', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Profit and Loss');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders breadcrumbs', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders the export button', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Export report')).toBeInTheDocument();
  });

  it('calls the P&L API with date range params', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('/api/reports/profit-and-loss');
    expect(url).toContain('start=');
    expect(url).toContain('end=');
  });

  it('renders report with data and correct totals', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Trading Income')).toBeInTheDocument();
    });

    // Revenue items
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Other Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Trading Income')).toBeInTheDocument();

    // Cost of Sales
    expect(screen.getByText('Cost of Sales')).toBeInTheDocument();
    expect(screen.getByText('Cost of Goods Sold')).toBeInTheDocument();
    expect(screen.getByText('Total Cost of Sales')).toBeInTheDocument();

    // Gross Profit
    expect(screen.getByText('Gross Profit')).toBeInTheDocument();

    // Operating Expenses
    expect(screen.getByText('Operating Expenses')).toBeInTheDocument();
    expect(screen.getByText('Advertising')).toBeInTheDocument();
    expect(screen.getByText('Office Expenses')).toBeInTheDocument();
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Wages and Salaries')).toBeInTheDocument();
    expect(screen.getByText('Total Operating Expenses')).toBeInTheDocument();

    // Net Profit
    expect(screen.getByText('Net Profit')).toBeInTheDocument();
  });

  it('displays formatted currency amounts', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    expect(screen.getByText('$45,000.00')).toBeInTheDocument();
    expect(screen.getByText('$2,000.00')).toBeInTheDocument();
    expect(screen.getByText('$47,000.00')).toBeInTheDocument();
    const fifteenK = screen.getAllByText('$15,000.00');
    expect(fifteenK.length).toBe(2);
    expect(screen.getByText('$32,000.00')).toBeInTheDocument();
    expect(screen.getByText('$9,000.00')).toBeInTheDocument();
  });

  it('renders the date range picker', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
  });

  it('renders the chart', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('profit-loss-chart')).toBeInTheDocument();
    });
  });
});
