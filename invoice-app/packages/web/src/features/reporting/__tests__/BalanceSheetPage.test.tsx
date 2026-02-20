// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BalanceSheetPage } from '../routes/BalanceSheetPage';
import type { BalanceSheetReport } from '../types';

const MOCK_BS: BalanceSheetReport = {
  asAt: '2026-02-16',
  currentAssets: [
    { accountName: 'Bank Account', amount: 25000 },
    { accountName: 'Accounts Receivable', amount: 12000 },
  ],
  fixedAssets: [
    { accountName: 'Equipment', amount: 10000 },
  ],
  currentLiabilities: [
    { accountName: 'Accounts Payable', amount: 8000 },
    { accountName: 'GST Payable', amount: 2100 },
  ],
  equity: [
    { accountName: 'Retained Earnings', amount: 36900 },
  ],
  totalCurrentAssets: 37000,
  totalFixedAssets: 10000,
  totalAssets: 47000,
  totalCurrentLiabilities: 10100,
  totalLiabilities: 10100,
  totalEquity: 36900,
  totalLiabilitiesAndEquity: 47000,
};

function mockFetch() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ ok: true, data: MOCK_BS }), {
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

describe('BalanceSheetPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = mockFetch();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the page title', () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Balance Sheet');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders breadcrumbs', () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders the export button', () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Export report')).toBeInTheDocument();
  });

  it('calls the balance sheet API with asAt param', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('/api/reports/balance-sheet');
    expect(url).toContain('asAt=');
  });

  it('renders all asset items', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Assets')).toBeInTheDocument();
    });

    expect(screen.getByText('Current Assets')).toBeInTheDocument();
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
    expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();
    expect(screen.getByText('Total Current Assets')).toBeInTheDocument();
    expect(screen.getByText('Fixed Assets')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Total Fixed Assets')).toBeInTheDocument();
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
  });

  it('renders all liability items', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Liabilities')).toBeInTheDocument();
    });

    expect(screen.getByText('Current Liabilities')).toBeInTheDocument();
    expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
    expect(screen.getByText('GST Payable')).toBeInTheDocument();
    expect(screen.getByText('Total Current Liabilities')).toBeInTheDocument();
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
  });

  it('renders equity section', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Equity')).toBeInTheDocument();
    });

    expect(screen.getByText('Retained Earnings')).toBeInTheDocument();
    expect(screen.getByText('Total Equity')).toBeInTheDocument();
  });

  it('displays formatted currency amounts', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Bank Account')).toBeInTheDocument();
    });

    expect(screen.getByText('$25,000.00')).toBeInTheDocument();
    expect(screen.getByText('$12,000.00')).toBeInTheDocument();
    const tenK = screen.getAllByText('$10,000.00');
    expect(tenK.length).toBe(2);
    expect(screen.getByText('$8,000.00')).toBeInTheDocument();
    expect(screen.getByText('$2,100.00')).toBeInTheDocument();
    const tenPointOneK = screen.getAllByText('$10,100.00');
    expect(tenPointOneK.length).toBe(2);
    const thirtySixK = screen.getAllByText('$36,900.00');
    expect(thirtySixK.length).toBe(2);
  });

  it('verifies assets equals liabilities plus equity', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total Assets')).toBeInTheDocument();
    });

    const amounts = screen.getAllByText('$47,000.00');
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the date range picker', () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('date-range-picker')).toBeInTheDocument();
  });

  it('renders Total Liabilities and Equity row', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total Liabilities and Equity')).toBeInTheDocument();
    });
  });

  it('renders balance verification showing balanced state', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('balance-verification')).toBeInTheDocument();
    });

    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });

  it('renders balance verification showing unbalanced state', async () => {
    const unbalancedBS = {
      ...MOCK_BS,
      totalAssets: 50000,
      totalLiabilitiesAndEquity: 47000,
    };
    fetchSpy.mockRestore();
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: unbalancedBS }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('balance-verification')).toBeInTheDocument();
    });

    expect(screen.getByText(/Difference/)).toBeInTheDocument();
  });
});
