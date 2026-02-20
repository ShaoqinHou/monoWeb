// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgedReceivablesPage } from '../routes/AgedReceivablesPage';
import type { AgedReport } from '../types';

// Mock TanStack Router — Link renders as a plain <a> with href
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

// Mock recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
}));

const MOCK_AGED: AgedReport = {
  buckets: [
    { label: 'Current', amount: 12000, count: 5 },
    { label: '1-30 days', amount: 8500, count: 3 },
    { label: '31-60 days', amount: 4200, count: 2 },
    { label: '61-90 days', amount: 1800, count: 1 },
    { label: '90+ days', amount: 3500, count: 2 },
  ],
  total: 30000,
};

function mockFetch() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ ok: true, data: MOCK_AGED }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('AgedReceivablesPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = mockFetch();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the page title', () => {
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Aged Receivables');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders breadcrumbs', () => {
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('calls the aged receivables API', async () => {
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/reports/aged-receivables');
  });

  it('renders total outstanding amount', async () => {
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('total-outstanding')).toBeInTheDocument();
    });

    expect(screen.getByTestId('total-outstanding')).toHaveTextContent('$30,000.00');
  });

  it('renders all aging bucket rows', async () => {
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    expect(screen.getByText('1-30 days')).toBeInTheDocument();
    expect(screen.getByText('31-60 days')).toBeInTheDocument();
    expect(screen.getByText('61-90 days')).toBeInTheDocument();
    expect(screen.getByText('90+ days')).toBeInTheDocument();
  });

  it('renders bucket amounts', async () => {
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('$12,000.00')).toBeInTheDocument();
    });

    expect(screen.getByText('$8,500.00')).toBeInTheDocument();
    expect(screen.getByText('$4,200.00')).toBeInTheDocument();
    expect(screen.getByText('$1,800.00')).toBeInTheDocument();
    expect(screen.getByText('$3,500.00')).toBeInTheDocument();
  });

  it('renders "View invoices" drill-down links for each bucket', async () => {
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('bucket-link-Current')).toBeInTheDocument();
    });

    const link = screen.getByTestId('bucket-link-Current');
    expect(link).toHaveAttribute('href', '/invoices?status=outstanding&aging=Current');

    const link2 = screen.getByTestId('bucket-link-1-30 days');
    expect(link2).toHaveAttribute('href', '/invoices?status=outstanding&aging=1-30%20days');
  });

  it('renders the chart', async () => {
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('aged-bucket-chart')).toBeInTheDocument();
    });
  });

  it('renders the export button', () => {
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Export report')).toBeInTheDocument();
  });

  it('renders total row with sum of all counts', async () => {
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    // Total count: 5 + 3 + 2 + 1 + 2 = 13
    expect(screen.getByText('13')).toBeInTheDocument();
  });
});
