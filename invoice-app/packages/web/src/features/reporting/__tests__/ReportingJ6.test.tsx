// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Recharts requires ResizeObserver
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const MOCK_AGED_REPORT = {
  buckets: [
    { label: 'Current', amount: 5000, count: 3 },
    { label: '1-30', amount: 3000, count: 2 },
  ],
  total: 8000,
};

const MOCK_FORECAST = {
  openingBalance: 50000,
  closingBalance: 62000,
  periods: [
    { label: 'Week 1', receivables: 15000, payables: 8000, netFlow: 7000, runningBalance: 57000 },
  ],
};

const MOCK_PNL = {
  dateRange: { from: '2026-01-01', to: '2026-12-31' },
  revenue: [{ accountName: 'Sales', amount: 100000 }],
  costOfSales: [],
  operatingExpenses: [{ accountName: 'Rent', amount: 20000 }],
  grossProfit: 100000,
  netProfit: 80000,
  totalRevenue: 100000,
  totalCostOfSales: 0,
  totalOperatingExpenses: 20000,
};

function mockFetchWith(data: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

// ---- ProfitAndLossPage new elements ----
describe('ProfitAndLossPage — new Xero elements', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => { fetchSpy = mockFetchWith(MOCK_PNL); });
  afterEach(() => { fetchSpy.mockRestore(); });

  it('renders Save as button', async () => {
    const { ProfitAndLossPage } = await import('../routes/ProfitAndLossPage');
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('save-as-btn')).toBeInTheDocument();
    expect(screen.getByText('Save as')).toBeInTheDocument();
  }, 15000);

  it('renders collapsible report sidebar with common formats', async () => {
    const { ProfitAndLossPage } = await import('../routes/ProfitAndLossPage');
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('report-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    expect(screen.getByText('Xero standard report')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-pnl-link')).toHaveTextContent('Profit and Loss');
    expect(screen.getByText('Common formats')).toBeInTheDocument();
    expect(screen.getByText('Budget Variance')).toBeInTheDocument();
    expect(screen.getByText('Current and previous 3 months')).toBeInTheDocument();
    expect(screen.getByText('Current financial year by month')).toBeInTheDocument();
    expect(screen.getByText(/actual and budget/)).toBeInTheDocument();
    expect(screen.getByText('Month to date comparison')).toBeInTheDocument();
    expect(screen.getByText('Year to date comparison')).toBeInTheDocument();
    expect(screen.getByText('Compare Region')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-learn-link')).toHaveTextContent(/Learn how to create a custom report/);
  });

  it('sidebar collapses when Minimise is clicked', async () => {
    const { ProfitAndLossPage } = await import('../routes/ProfitAndLossPage');
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('sidebar-toggle-btn'));
    expect(screen.queryByTestId('sidebar-content')).not.toBeInTheDocument();
  });

  it('renders editable report title', async () => {
    const { ProfitAndLossPage } = await import('../routes/ProfitAndLossPage');
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('editable-title')).toBeInTheDocument();
    expect(screen.getByTestId('title-display')).toHaveTextContent('Profit and Loss');
  });

  it('renders Compare with dropdown defaulting to None', async () => {
    const { ProfitAndLossPage } = await import('../routes/ProfitAndLossPage');
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('compare-with-control')).toBeInTheDocument();
    const select = screen.getByTestId('compare-with-select') as HTMLSelectElement;
    expect(select.value).toBe('none');
    // Check options exist within the compare-with select
    const options = select.querySelectorAll('option');
    const optionValues = Array.from(options).map(o => o.value);
    expect(optionValues).toContain('none');
    expect(optionValues).toContain('prior-period');
    expect(optionValues).toContain('same-period-last-year');
    expect(optionValues).toContain('budget');
    expect(screen.getByText('1 period ago')).toBeInTheDocument();
    expect(screen.getByText('Same period last year')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
  });

  it('renders Compare tracking categories dropdown', async () => {
    const { ProfitAndLossPage } = await import('../routes/ProfitAndLossPage');
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('tracking-category-control')).toBeInTheDocument();
    const select = screen.getByTestId('tracking-category-select') as HTMLSelectElement;
    expect(select.value).toBe('None');
  });

  it('renders Filter, More, and Update buttons', async () => {
    const { ProfitAndLossPage } = await import('../routes/ProfitAndLossPage');
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('filter-btn')).toBeInTheDocument();
    expect(screen.getByTestId('more-btn')).toBeInTheDocument();
    expect(screen.getByTestId('update-btn')).toBeInTheDocument();
  });

  it('renders footer toolbar with Edit layout, Insert content, Compact view switch, and Export', async () => {
    const { ProfitAndLossPage } = await import('../routes/ProfitAndLossPage');
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('report-footer-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('edit-layout-btn')).toBeInTheDocument();
    expect(screen.getByTestId('insert-content-btn')).toBeInTheDocument();
    expect(screen.getByTestId('compact-view-switch')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByTestId('footer-export-btn')).toBeInTheDocument();
  });

  it('renders report amounts as clickable drill-down links', async () => {
    const { ProfitAndLossPage } = await import('../routes/ProfitAndLossPage');
    render(<ProfitAndLossPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Trading Income')).toBeInTheDocument();
    });
    const salesLink = screen.getByTestId('drill-down-sales');
    expect(salesLink).toBeInTheDocument();
    expect(salesLink.tagName).toBe('A');
    expect(salesLink.getAttribute('href')).toContain('/reporting/account-transactions');
  });
});

// ---- BalanceSheetPage new elements ----
describe('BalanceSheetPage — new Xero elements', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  const MOCK_BS = {
    asAt: '2026-02-17',
    currentAssets: [{ accountName: 'Cash', amount: 50000 }],
    fixedAssets: [],
    currentLiabilities: [{ accountName: 'Tax', amount: 5000 }],
    equity: [{ accountName: 'Retained', amount: 45000 }],
    totalCurrentAssets: 50000,
    totalFixedAssets: 0,
    totalAssets: 50000,
    totalCurrentLiabilities: 5000,
    totalLiabilities: 5000,
    totalEquity: 45000,
    totalLiabilitiesAndEquity: 50000,
  };

  beforeEach(() => { fetchSpy = mockFetchWith(MOCK_BS); });
  afterEach(() => { fetchSpy.mockRestore(); });

  it('renders Save as button', async () => {
    const { BalanceSheetPage } = await import('../routes/BalanceSheetPage');
    render(<BalanceSheetPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('save-as-btn')).toBeInTheDocument();
  });

  it('renders Common Formats with BS-specific options', async () => {
    const { BalanceSheetPage } = await import('../routes/BalanceSheetPage');
    render(<BalanceSheetPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('common-formats-btn'));
    expect(screen.getByText('Monthly comparison')).toBeInTheDocument();
    expect(screen.getByText('Quarterly comparison')).toBeInTheDocument();
    expect(screen.getByText('Yearly comparison')).toBeInTheDocument();
  });

  it('renders editable report title', async () => {
    const { BalanceSheetPage } = await import('../routes/BalanceSheetPage');
    render(<BalanceSheetPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('title-display')).toHaveTextContent('Balance Sheet');
  });
});

// ---- AgedReceivablesPage new elements ----
describe('AgedReceivablesPage — new Xero elements', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => { fetchSpy = mockFetchWith(MOCK_AGED_REPORT); });
  afterEach(() => { fetchSpy.mockRestore(); });

  it('renders ageing periods control', async () => {
    const { AgedReceivablesPage } = await import('../routes/AgedReceivablesPage');
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTestId('ageing-periods-control')).toBeInTheDocument());
    expect(screen.getByTestId('ageing-periods-select')).toBeInTheDocument();
    expect(screen.getByTestId('ageing-interval-select')).toBeInTheDocument();
  });

  it('renders ageing by selector', async () => {
    const { AgedReceivablesPage } = await import('../routes/AgedReceivablesPage');
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('ageing-by-control')).toBeInTheDocument();
    expect(screen.getByTestId('ageing-by-select')).toBeInTheDocument();
  });

  it('renders columns selector', async () => {
    const { AgedReceivablesPage } = await import('../routes/AgedReceivablesPage');
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('columns-control')).toBeInTheDocument();
    expect(screen.getByTestId('columns-btn')).toHaveTextContent('3 columns selected');
  });

  it('renders grouping/summarising dropdown', async () => {
    const { AgedReceivablesPage } = await import('../routes/AgedReceivablesPage');
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('grouping-control')).toBeInTheDocument();
    expect(screen.getByTestId('grouping-select')).toBeInTheDocument();
  });

  it('renders Related Reports section', async () => {
    const { AgedReceivablesPage } = await import('../routes/AgedReceivablesPage');
    render(<AgedReceivablesPage />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTestId('related-reports')).toBeInTheDocument());
    expect(screen.getByTestId('related-aged-payables')).toBeInTheDocument();
    expect(screen.getByTestId('related-profit-and-loss')).toBeInTheDocument();
    expect(screen.getByTestId('related-account-transactions')).toBeInTheDocument();
  });
});

// ---- AgedPayablesPage new elements ----
describe('AgedPayablesPage — new Xero elements', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => { fetchSpy = mockFetchWith(MOCK_AGED_REPORT); });
  afterEach(() => { fetchSpy.mockRestore(); });

  it('renders ageing controls and related reports', async () => {
    const { AgedPayablesPage } = await import('../routes/AgedPayablesPage');
    render(<AgedPayablesPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('ageing-periods-control')).toBeInTheDocument();
    expect(screen.getByTestId('ageing-by-control')).toBeInTheDocument();
    expect(screen.getByTestId('columns-control')).toBeInTheDocument();
    expect(screen.getByTestId('grouping-control')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('related-reports')).toBeInTheDocument());
    expect(screen.getByTestId('related-aged-receivables')).toBeInTheDocument();
  });
});

// ---- CashFlowForecastPage new elements ----
describe('CashFlowForecastPage — new Xero elements', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => { fetchSpy = mockFetchWith(MOCK_FORECAST); });
  afterEach(() => { fetchSpy.mockRestore(); });

  it('renders projection chart with Today marker', async () => {
    const { CashFlowForecastPage } = await import('../routes/CashFlowForecastPage');
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTestId('projection-chart')).toBeInTheDocument());
    expect(screen.getByTestId('today-marker')).toBeInTheDocument();
    expect(screen.getByTestId('today-label')).toHaveTextContent('Today');
  });

  it('renders weekly breakdown section', async () => {
    const { CashFlowForecastPage } = await import('../routes/CashFlowForecastPage');
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTestId('weekly-breakdown')).toBeInTheDocument());
    expect(screen.getByText('Weekly Breakdown')).toBeInTheDocument();
    expect(screen.getByText('This week')).toBeInTheDocument();
    expect(screen.getByText('Next week')).toBeInTheDocument();
  });

  it('expands weekly breakdown to show contacts', async () => {
    const { CashFlowForecastPage } = await import('../routes/CashFlowForecastPage');
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTestId('week-toggle-this-week')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('week-toggle-this-week'));
    expect(screen.getByTestId('week-contacts-this-week')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders suggested actions cards', async () => {
    const { CashFlowForecastPage } = await import('../routes/CashFlowForecastPage');
    render(<CashFlowForecastPage />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByTestId('suggested-actions')).toBeInTheDocument());
    expect(screen.getByText('Overdue invoices')).toBeInTheDocument();
    expect(screen.getByText('Overdue bills')).toBeInTheDocument();
    expect(screen.getByTestId('action-overdue-invoices')).toBeInTheDocument();
    expect(screen.getByTestId('action-overdue-bills')).toBeInTheDocument();
  });
});
