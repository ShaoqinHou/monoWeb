// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountTransactionsPage } from '../routes/AccountTransactionsPage';
import { BusinessSnapshotPage } from '../routes/BusinessSnapshotPage';
import { ExecutiveSummaryPage } from '../routes/ExecutiveSummaryPage';
import { PayrollReportPage } from '../routes/PayrollReportPage';
import { BankReconciliationReportPage } from '../routes/BankReconciliationReportPage';
import { PeriodCompareToggle } from '../components/PeriodCompareToggle';
import { BasisToggle } from '../components/BasisToggle';
import type { AccountingBasis } from '../components/BasisToggle';
import { ScheduleReportDialog } from '../components/ScheduleReportDialog';
import { useExportPdf } from '../hooks/useExportPdf';
import { useFavoriteReports } from '../hooks/useFavoriteReports';

// Mock lucide-react icons to avoid SVG rendering issues
vi.mock('lucide-react', () => ({
  TrendingUp: (props: Record<string, unknown>) => <span data-testid="icon-trending-up" {...props} />,
  TrendingDown: (props: Record<string, unknown>) => <span data-testid="icon-trending-down" {...props} />,
  DollarSign: (props: Record<string, unknown>) => <span data-testid="icon-dollar" {...props} />,
  Wallet: (props: Record<string, unknown>) => <span data-testid="icon-wallet" {...props} />,
  ArrowUpRight: (props: Record<string, unknown>) => <span data-testid="icon-arrow-up" {...props} />,
  ArrowDownRight: (props: Record<string, unknown>) => <span data-testid="icon-arrow-down" {...props} />,
  Download: (props: Record<string, unknown>) => <span data-testid="icon-download" {...props} />,
  ChevronRight: (props: Record<string, unknown>) => <span data-testid="icon-chevron" {...props} />,
  ChevronDown: (props: Record<string, unknown>) => <span data-testid="icon-chevron-down" {...props} />,
  X: (props: Record<string, unknown>) => <span data-testid="icon-x" {...props} />,
  Loader2: (props: Record<string, unknown>) => <span data-testid="icon-loader" {...props} />,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// --- AccountTransactionsPage ---
describe('AccountTransactionsPage', () => {
  it('renders the page title and account dropdown', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Account Transactions');
    expect(titles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Account')).toBeInTheDocument();
  });

  it('shows transactions when account is selected', () => {
    render(<AccountTransactionsPage />, { wrapper: createWrapper() });
    const select = screen.getByLabelText('Account');
    fireEvent.change(select, { target: { value: '200' } });
    expect(screen.getByText('Invoice #INV-001')).toBeInTheDocument();
    expect(screen.getByText('Payment received')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
  });
});

// --- BusinessSnapshotPage ---
describe('BusinessSnapshotPage', () => {
  it('renders 6 KPI cards', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('kpi-grid')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Profit')).toBeInTheDocument();
    expect(screen.getByText('Cash Position')).toBeInTheDocument();
    expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();
    expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
  });

  it('shows formatted currency values', () => {
    render(<BusinessSnapshotPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('kpi-total-revenue')).toHaveTextContent('$247,500.00');
    expect(screen.getByTestId('kpi-net-profit')).toHaveTextContent('$84,300.00');
  });
});

// --- ExecutiveSummaryPage ---
describe('ExecutiveSummaryPage', () => {
  it('renders P&L, Balance Sheet, and Cash sections', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('pnl-summary')).toBeInTheDocument();
    expect(screen.getByTestId('bs-summary')).toBeInTheDocument();
    expect(screen.getByTestId('cash-summary')).toBeInTheDocument();
  });

  it('shows key financial figures', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Net Profit')).toBeInTheDocument();
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('Closing Balance')).toBeInTheDocument();
  });
});

// --- PayrollReportPage ---
describe('PayrollReportPage', () => {
  it('renders payroll data by period', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Jan 2026')).toBeInTheDocument();
    expect(screen.getByText('Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('Mar 2026')).toBeInTheDocument();
  });

  it('shows employee names and columns', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText('John Smith').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gross Pay').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('PAYE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('KiwiSaver').length).toBeGreaterThanOrEqual(1);
  });
});

// --- BankReconciliationReportPage ---
describe('BankReconciliationReportPage', () => {
  it('renders bank reconciliation table', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Business Cheque Account')).toBeInTheDocument();
    expect(screen.getByText('Business Savings Account')).toBeInTheDocument();
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  it('shows reconciled and unreconciled columns', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reconciled')).toBeInTheDocument();
    expect(screen.getByText('Unreconciled')).toBeInTheDocument();
    expect(screen.getByText('Difference')).toBeInTheDocument();
  });
});

// --- PeriodCompareToggle ---
describe('PeriodCompareToggle', () => {
  it('renders checkbox with label and fires onChange', () => {
    const onChange = vi.fn();
    render(<PeriodCompareToggle enabled={false} onChange={onChange} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('shows checked state when enabled', () => {
    render(<PeriodCompareToggle enabled={true} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});

// --- BasisToggle ---
describe('BasisToggle', () => {
  it('renders accrual and cash buttons', () => {
    render(<BasisToggle basis="accrual" onChange={vi.fn()} />);
    expect(screen.getByText('Accrual')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
  });

  it('calls onChange when switching basis', () => {
    const onChange = vi.fn();
    render(<BasisToggle basis="accrual" onChange={onChange} />);
    fireEvent.click(screen.getByText('Cash'));
    expect(onChange).toHaveBeenCalledWith('cash');
  });
});

// --- ScheduleReportDialog ---
describe('ScheduleReportDialog', () => {
  it('renders when open with report name', () => {
    render(<ScheduleReportDialog open={true} onClose={vi.fn()} reportName="P&L" />);
    expect(screen.getByText('Schedule: P&L')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('Recipient Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Format')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ScheduleReportDialog open={false} onClose={vi.fn()} reportName="P&L" />);
    expect(screen.queryByText('Schedule: P&L')).not.toBeInTheDocument();
  });
});

// --- useExportPdf ---
describe('useExportPdf', () => {
  it('calls window.print when invoked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    function TestComponent() {
      const exportPdf = useExportPdf();
      return <button onClick={exportPdf}>Print</button>;
    }
    render(<TestComponent />);
    fireEvent.click(screen.getByText('Print'));
    expect(printSpy).toHaveBeenCalledOnce();
    printSpy.mockRestore();
  });
});

// --- useFavoriteReports ---
describe('useFavoriteReports', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts with empty favorites', () => {
    function TestComponent() {
      const { favorites } = useFavoriteReports();
      return <span data-testid="count">{favorites.length}</span>;
    }
    render(<TestComponent />);
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('toggles favorite and persists to localStorage', () => {
    function TestComponent() {
      const { favorites, toggleFavorite, isFavorite } = useFavoriteReports();
      return (
        <div>
          <span data-testid="count">{favorites.length}</span>
          <span data-testid="is-fav">{isFavorite('/reports/pnl') ? 'yes' : 'no'}</span>
          <button onClick={() => toggleFavorite('/reports/pnl')}>Toggle</button>
        </div>
      );
    }
    render(<TestComponent />);
    expect(screen.getByTestId('is-fav')).toHaveTextContent('no');
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('is-fav')).toHaveTextContent('yes');
    // Toggle again to remove
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('is-fav')).toHaveTextContent('no');
  });
});
