// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InsightsWidget } from '../components/InsightsWidget';
import type { DashboardInsights } from '../types';

function makeInsights(overrides?: Partial<DashboardInsights>): DashboardInsights {
  return {
    revenue: { thisMonth: 29000, lastMonth: 26000, changePercent: 11.5 },
    expenses: { thisMonth: 18000, lastMonth: 19000, changePercent: -5.3 },
    cashPosition: 45000,
    bankAccountCount: 2,
    topDebtors: [
      { name: 'Ridgeway University', total: 5250 },
      { name: 'Acme Corp', total: 3100 },
    ],
    ...overrides,
  };
}

function mockFetchWith(data: DashboardInsights) {
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
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const WAIT_OPTS = { timeout: 3000 };

describe('InsightsWidget', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders insights heading', () => {
    globalThis.fetch = mockFetchWith(makeInsights());
    render(<InsightsWidget />, { wrapper: createWrapper() });
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('shows revenue with trend arrow', async () => {
    globalThis.fetch = mockFetchWith(makeInsights());
    render(<InsightsWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('insight-revenue')).toBeInTheDocument();
    }, WAIT_OPTS);
    expect(screen.getByTestId('trend-revenue')).toHaveTextContent('+11.5% vs last month');
  });

  it('shows expenses with negative trend', async () => {
    globalThis.fetch = mockFetchWith(makeInsights());
    render(<InsightsWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('insight-expenses')).toBeInTheDocument();
    }, WAIT_OPTS);
    expect(screen.getByTestId('trend-expenses')).toHaveTextContent('-5.3% vs last month');
  });

  it('shows cash position with green color for positive', async () => {
    globalThis.fetch = mockFetchWith(makeInsights());
    render(<InsightsWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('insight-cash-position')).toBeInTheDocument();
    }, WAIT_OPTS);
    const cashEl = screen.getByTestId('insight-cash-position');
    const amount = cashEl.querySelector('.text-green-700');
    expect(amount).toBeInTheDocument();
  });

  it('shows cash position with red color for negative', async () => {
    globalThis.fetch = mockFetchWith(makeInsights({ cashPosition: -5000 }));
    render(<InsightsWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('insight-cash-position')).toBeInTheDocument();
    }, WAIT_OPTS);
    const cashEl = screen.getByTestId('insight-cash-position');
    const amount = cashEl.querySelector('.text-red-700');
    expect(amount).toBeInTheDocument();
  });

  it('renders top debtors list', async () => {
    globalThis.fetch = mockFetchWith(makeInsights());
    render(<InsightsWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('insight-top-debtors')).toBeInTheDocument();
    }, WAIT_OPTS);
    expect(screen.getByText('Ridgeway University')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('hides debtors section when empty', async () => {
    globalThis.fetch = mockFetchWith(makeInsights({ topDebtors: [] }));
    render(<InsightsWidget />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByTestId('insight-revenue')).toBeInTheDocument();
    }, WAIT_OPTS);
    expect(screen.queryByTestId('insight-top-debtors')).not.toBeInTheDocument();
  });
});
