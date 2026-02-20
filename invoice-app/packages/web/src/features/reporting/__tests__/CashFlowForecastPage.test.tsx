// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CashFlowForecastPage } from '../routes/CashFlowForecastPage';
import type { CashFlowForecastReport } from '../types';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

const MOCK_FORECAST: CashFlowForecastReport = {
  openingBalance: 50000,
  closingBalance: 62000,
  periods: [
    { label: 'Week 1', receivables: 15000, payables: 8000, netFlow: 7000, runningBalance: 57000 },
    { label: 'Week 2', receivables: 10000, payables: 12000, netFlow: -2000, runningBalance: 55000 },
    { label: 'Week 3', receivables: 8000, payables: 5000, netFlow: 3000, runningBalance: 58000 },
    { label: 'Week 4', receivables: 12000, payables: 8000, netFlow: 4000, runningBalance: 62000 },
  ],
};

function mockFetch() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ ok: true, data: MOCK_FORECAST }), {
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

describe('CashFlowForecastPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = mockFetch();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the page title', () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Cash Flow Forecast');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders breadcrumbs', () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders the export button', () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Export report')).toBeInTheDocument();
  });

  it('renders the forecast period picker', () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('forecast-period-picker')).toBeInTheDocument();
    expect(screen.getByText('Forecast Period')).toBeInTheDocument();
  });

  it('renders subtitle with days', () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Projected cash flow for the next 30 days')).toBeInTheDocument();
  });

  it('calls the cash flow forecast API with days param', async () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('/api/reports/cash-flow-forecast');
    expect(url).toContain('days=30');
  });

  it('renders the cash-flow-forecast test id', async () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('cash-flow-forecast')).toBeInTheDocument();
    });
  });

  it('renders summary cards', async () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Opening Balance')).toBeInTheDocument();
    });

    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Projected Closing')).toBeInTheDocument();
  });

  it('renders period rows in the table', async () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText('Week 1').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Week 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Week 3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Week 4').length).toBeGreaterThan(0);
  });

  it('renders the table column headers', async () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Period')).toBeInTheDocument();
    });

    expect(screen.getByText('Receivables (In)')).toBeInTheDocument();
    expect(screen.getByText('Payables (Out)')).toBeInTheDocument();
    expect(screen.getByText('Net Flow')).toBeInTheDocument();
    expect(screen.getByText('Running Balance')).toBeInTheDocument();
  });

  it('renders the totals row', async () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  it('renders formatted opening balance', async () => {
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('$50,000.00')).toBeInTheDocument();
    });
  });
});
