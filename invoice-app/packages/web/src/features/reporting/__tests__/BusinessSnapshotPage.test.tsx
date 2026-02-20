// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BusinessSnapshotPage } from '../routes/BusinessSnapshotPage';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: Record<string, unknown>) => (
    <a href={to as string} {...rest}>{children as React.ReactNode}</a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock('lucide-react', () => {
  const icon = (name: string) => {
    const Icon = (props: Record<string, unknown>) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    TrendingUp: icon('TrendingUp'),
    TrendingDown: icon('TrendingDown'),
    DollarSign: icon('DollarSign'),
    Wallet: icon('Wallet'),
    ArrowUpRight: icon('ArrowUpRight'),
    ArrowDownRight: icon('ArrowDownRight'),
    ChevronRight: icon('ChevronRight'),
    Download: icon('Download'),
    Loader2: icon('Loader2'),
    Pencil: icon('Pencil'),
    Printer: icon('Printer'),
    ExternalLink: icon('ExternalLink'),
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('BusinessSnapshotPage', () => {
  it('renders the page title', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Business Snapshot');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders breadcrumb navigation with Reports link', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders 3 section headings: Profitability, Efficiency, Financial Position', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('section-profitability')).toBeInTheDocument();
    expect(screen.getByText('Profitability')).toBeInTheDocument();
    expect(screen.getByTestId('section-efficiency')).toBeInTheDocument();
    expect(screen.getByText('Efficiency')).toBeInTheDocument();
    expect(screen.getByTestId('section-financial-position')).toBeInTheDocument();
    expect(screen.getByText('Financial Position')).toBeInTheDocument();
  });

  it('renders profitability metrics: Profit or Loss, Income, Expenses', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Profit or Loss')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('renders efficiency metrics: margin values and largest expenses', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Net profit margin')).toBeInTheDocument();
    expect(screen.getByTestId('net-profit-margin')).toHaveTextContent('34.1%');
    expect(screen.getByText('Gross profit margin')).toBeInTheDocument();
    expect(screen.getByTestId('gross-profit-donut')).toBeInTheDocument();
    expect(screen.getByTestId('largest-expenses')).toBeInTheDocument();
    expect(screen.getByText('Salaries & Wages')).toBeInTheDocument();
  });

  it('renders financial position section with balance sheet, cash, and avg days', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('balance-sheet-summary')).toBeInTheDocument();
    expect(screen.getByText('Cash balance')).toBeInTheDocument();
    expect(screen.getByTestId('avg-time-to-get-paid')).toHaveTextContent('28 days');
    expect(screen.getByTestId('avg-time-to-pay')).toHaveTextContent('35 days');
  });

  it('renders toolbar with Edit metrics, Print, and Accrual/Cash basis selector', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('snapshot-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('edit-metrics-btn')).toBeInTheDocument();
    expect(screen.getByTestId('print-btn')).toBeInTheDocument();
    expect(screen.getByTestId('basis-selector')).toBeInTheDocument();
    expect(screen.getByTestId('basis-accrual')).toBeInTheDocument();
    expect(screen.getByTestId('basis-cash')).toBeInTheDocument();
  });

  it('renders drill down links', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    const drillLinks = screen.getAllByText('Drill down to report');
    expect(drillLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('displays formatted currency values in profitability section', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('kpi-profit-or-loss')).toHaveTextContent('$84,300.00');
    expect(screen.getByTestId('kpi-income')).toHaveTextContent('$247,500.00');
    expect(screen.getByTestId('kpi-expenses')).toHaveTextContent('$163,200.00');
  });

  it('displays trend labels', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    expect(screen.getByText('28.1% vs prior year')).toBeInTheDocument();
    expect(screen.getByText('12.5% vs prior year')).toBeInTheDocument();
  });

  it('renders Show financial ratios toggle switch', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    const toggle = screen.getByRole('switch', { name: /show financial ratios/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles Show financial ratios on click', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    const toggle = screen.getByRole('switch', { name: /show financial ratios/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});
