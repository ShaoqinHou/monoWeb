// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AgedPayablesPage } from '../routes/AgedPayablesPage';
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
    { label: 'Current', amount: 9000, count: 4 },
    { label: '1-30 days', amount: 6500, count: 3 },
    { label: '31-60 days', amount: 3100, count: 1 },
    { label: '61-90 days', amount: 900, count: 1 },
    { label: '90+ days', amount: 2500, count: 2 },
  ],
  total: 22000,
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

describe('AgedPayablesPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = mockFetch();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the page title', () => {
    render(<AgedPayablesPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Aged Payables');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('calls the aged payables API', async () => {
    render(<AgedPayablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/reports/aged-payables');
  });

  it('renders total outstanding amount', async () => {
    render(<AgedPayablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('total-outstanding')).toBeInTheDocument();
    });

    expect(screen.getByTestId('total-outstanding')).toHaveTextContent('$22,000.00');
  });

  it('renders all aging bucket rows', async () => {
    render(<AgedPayablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    expect(screen.getByText('1-30 days')).toBeInTheDocument();
    expect(screen.getByText('31-60 days')).toBeInTheDocument();
    expect(screen.getByText('61-90 days')).toBeInTheDocument();
    expect(screen.getByText('90+ days')).toBeInTheDocument();
  });

  it('renders "View bills" links instead of invoices', async () => {
    render(<AgedPayablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('bucket-link-Current')).toBeInTheDocument();
    });

    const link = screen.getByTestId('bucket-link-Current');
    expect(link).toHaveAttribute('href', '/bills?status=outstanding&aging=Current');
    expect(link).toHaveTextContent('View bills');
  });

  it('renders the chart', async () => {
    render(<AgedPayablesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('aged-bucket-chart')).toBeInTheDocument();
    });
  });

  it('renders breadcrumbs', () => {
    render(<AgedPayablesPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });
});
