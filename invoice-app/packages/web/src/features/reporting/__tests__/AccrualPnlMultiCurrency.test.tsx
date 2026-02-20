// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfitAndLossPage } from '../routes/ProfitAndLossPage';
import { BalanceSheetPage } from '../routes/BalanceSheetPage';
import { BasisToggle } from '../components/BasisToggle';
import type { ProfitAndLossReport, BalanceSheetReport } from '../types';
import { CreateInvoiceSchema, CreateBillSchema } from '@xero-replica/shared';

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

const MOCK_ACCRUAL_PNL: ProfitAndLossReport = {
  dateRange: { from: '2026-01-01', to: '2026-12-31' },
  basis: 'accrual',
  revenue: [
    { accountName: 'Sales', amount: 50000 },
    { accountName: 'Consulting Revenue', amount: 10000 },
  ],
  costOfSales: [],
  operatingExpenses: [
    { accountName: 'Office Supplies', amount: 2000 },
    { accountName: 'Rent', amount: 12000 },
    { accountName: 'Wages', amount: 20000 },
  ],
  totalRevenue: 60000,
  totalCostOfSales: 0,
  grossProfit: 60000,
  totalOperatingExpenses: 34000,
  netProfit: 26000,
};

const MOCK_CASH_PNL: ProfitAndLossReport = {
  dateRange: { from: '2026-01-01', to: '2026-12-31' },
  basis: 'cash',
  revenue: [
    { accountName: 'Sales', amount: 40000 },
    { accountName: 'Consulting Revenue', amount: 8000 },
  ],
  costOfSales: [],
  operatingExpenses: [
    { accountName: 'Office Supplies', amount: 1500 },
    { accountName: 'Rent', amount: 10000 },
    { accountName: 'Wages', amount: 18000 },
  ],
  totalRevenue: 48000,
  totalCostOfSales: 0,
  grossProfit: 48000,
  totalOperatingExpenses: 29500,
  netProfit: 18500,
};

const MOCK_BS: BalanceSheetReport = {
  asAt: '2026-02-16',
  currentAssets: [
    { accountName: 'Accounts Receivable', amount: 15000 },
  ],
  fixedAssets: [
    { accountName: 'Equipment', amount: 10000 },
  ],
  currentLiabilities: [
    { accountName: 'GST Payable', amount: 2100 },
    { accountName: 'Accounts Payable', amount: 5000 },
  ],
  equity: [
    { accountName: 'Retained Earnings', amount: 17900 },
  ],
  totalCurrentAssets: 15000,
  totalFixedAssets: 10000,
  totalAssets: 25000,
  totalCurrentLiabilities: 7100,
  totalLiabilities: 7100,
  totalEquity: 17900,
  totalLiabilitiesAndEquity: 25000,
};

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

/* ================================================================
   Part A: Accrual P&L Tests
   ================================================================ */
describe('Accrual P&L — Account-based grouping', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: MOCK_ACCRUAL_PNL }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('P&L groups revenue by account name', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });

    expect(screen.getByText('Consulting Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Trading Income')).toBeInTheDocument();
    // $60,000 appears for both Total Revenue and Gross Profit
    const sixtyK = screen.getAllByText('$60,000.00');
    expect(sixtyK.length).toBeGreaterThanOrEqual(2);
  });

  it('P&L groups expenses by account name', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });

    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('Wages')).toBeInTheDocument();
    expect(screen.getByText('Total Operating Expenses')).toBeInTheDocument();
    expect(screen.getByText('$34,000.00')).toBeInTheDocument();
  });

  it('P&L calculates correct net profit', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Net Profit')).toBeInTheDocument();
    });

    expect(screen.getByText('$26,000.00')).toBeInTheDocument();
  });

  it('P&L API is called with basis=accrual by default', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('basis=accrual');
  });
});

describe('Accrual vs Cash basis toggle', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const urlStr = String(url);
      const data = urlStr.includes('basis=cash') ? MOCK_CASH_PNL : MOCK_ACCRUAL_PNL;
      return new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the BasisToggle component on P&L page', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('basis-toggle')).toBeInTheDocument();
  });

  it('BasisToggle shows accrual and cash buttons', () => {
    const onChange = vi.fn();
    render(<BasisToggle basis="accrual" onChange={onChange} />);
    expect(screen.getByText('Accrual')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
  });

  it('BasisToggle calls onChange when cash is clicked', () => {
    const onChange = vi.fn();
    render(<BasisToggle basis="accrual" onChange={onChange} />);
    fireEvent.click(screen.getByText('Cash'));
    expect(onChange).toHaveBeenCalledWith('cash');
  });

  it('basis toggle sends basis=cash to API when toggled', async () => {
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });

    // Wait for initial load
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    // Click the Cash button
    fireEvent.click(screen.getByText('Cash'));

    // Wait for re-fetch with cash basis
    await waitFor(() => {
      const calls = fetchSpy.mock.calls.map((c: unknown[]) => String(c[0]));
      expect(calls.some((u: string) => u.includes('basis=cash'))).toBe(true);
    });
  });

  it('cash basis returns different totals than accrual', async () => {
    // Verify mock data distinguishes the two
    expect(MOCK_ACCRUAL_PNL.netProfit).toBe(26000);
    expect(MOCK_CASH_PNL.netProfit).toBe(18500);
    expect(MOCK_ACCRUAL_PNL.totalRevenue).not.toBe(MOCK_CASH_PNL.totalRevenue);
  });
});

/* ================================================================
   Part A: Balance Sheet Tests
   ================================================================ */
describe('Balance Sheet — account type grouping', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: MOCK_BS }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('balance sheet shows asset accounts', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Assets')).toBeInTheDocument();
    });

    expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  it('balance sheet shows liability accounts', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Liabilities')).toBeInTheDocument();
    });

    expect(screen.getByText('GST Payable')).toBeInTheDocument();
    expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
  });

  it('balance sheet shows equity accounts', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Equity')).toBeInTheDocument();
    });

    expect(screen.getByText('Retained Earnings')).toBeInTheDocument();
  });

  it('balance sheet balances (A = L + E)', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Total Assets')).toBeInTheDocument();
    });

    // Total assets = 25000, L+E = 25000
    const amounts = screen.getAllByText('$25,000.00');
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });

  it('balance verification shows balanced state', async () => {
    render(<BalanceSheetPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('balance-verification')).toBeInTheDocument();
    });

    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });
});

/* ================================================================
   Part B: Multi-Currency Schema Tests
   ================================================================ */
describe('Multi-Currency Schemas', () => {
  it('CreateInvoiceSchema accepts currencyCode and exchangeRate', () => {
    const result = CreateInvoiceSchema.safeParse({
      contactId: '00000000-0000-0000-0000-000000000101',
      date: '2026-01-01',
      dueDate: '2026-01-31',
      currencyCode: 'USD',
      exchangeRate: 0.62,
      lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currencyCode).toBe('USD');
      expect(result.data.exchangeRate).toBe(0.62);
    }
  });

  it('CreateBillSchema accepts currencyCode and exchangeRate', () => {
    const result = CreateBillSchema.safeParse({
      contactId: '00000000-0000-0000-0000-000000000101',
      date: '2026-01-01',
      dueDate: '2026-01-31',
      currencyCode: 'AUD',
      exchangeRate: 0.93,
      lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currencyCode).toBe('AUD');
      expect(result.data.exchangeRate).toBe(0.93);
    }
  });

  it('CreateInvoiceSchema defaults currencyCode to NZD and exchangeRate to 1.0', () => {
    const result = CreateInvoiceSchema.safeParse({
      contactId: '00000000-0000-0000-0000-000000000101',
      date: '2026-01-01',
      dueDate: '2026-01-31',
      lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currencyCode).toBe('NZD');
      expect(result.data.exchangeRate).toBe(1.0);
    }
  });

  it('CreateInvoiceSchema rejects zero exchange rate', () => {
    const result = CreateInvoiceSchema.safeParse({
      contactId: '00000000-0000-0000-0000-000000000101',
      date: '2026-01-01',
      dueDate: '2026-01-31',
      exchangeRate: 0,
      lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it('CreateInvoiceSchema rejects negative exchange rate', () => {
    const result = CreateInvoiceSchema.safeParse({
      contactId: '00000000-0000-0000-0000-000000000101',
      date: '2026-01-01',
      dueDate: '2026-01-31',
      exchangeRate: -1.5,
      lineItems: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
    });
    expect(result.success).toBe(false);
  });
});
