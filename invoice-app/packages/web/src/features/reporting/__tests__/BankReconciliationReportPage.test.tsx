// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BankReconciliationReportPage } from '../routes/BankReconciliationReportPage';

vi.mock('lucide-react', () => {
  const icon = (name: string) => {
    const Icon = (props: Record<string, unknown>) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    ChevronRight: icon('ChevronRight'),
    Download: icon('Download'),
    Loader2: icon('Loader2'),
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

describe('BankReconciliationReportPage', () => {
  it('renders the page title', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Bank Reconciliation');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders breadcrumb with Reports link', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders subtitle with current date', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/As at/)).toBeInTheDocument();
  });

  it('renders table headers for reconciliation columns', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Bank Account')).toBeInTheDocument();
    expect(screen.getByText('Reconciled')).toBeInTheDocument();
    expect(screen.getByText('Unreconciled')).toBeInTheDocument();
    expect(screen.getByText('Difference')).toBeInTheDocument();
  });

  it('renders all bank account names', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Business Cheque Account')).toBeInTheDocument();
    expect(screen.getByText('Business Savings Account')).toBeInTheDocument();
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
    expect(screen.getByText('PayPal')).toBeInTheDocument();
  });

  it('renders formatted reconciled amounts', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('$42,350.00')).toBeInTheDocument();
    // $18,500.00 appears twice (reconciled = difference for Business Savings, unreconciled = $0)
    expect(screen.getAllByText('$18,500.00').length).toBeGreaterThan(0);
    expect(screen.getByText('$8,750.00')).toBeInTheDocument();
    expect(screen.getByText('$3,200.00')).toBeInTheDocument();
  });

  it('renders formatted unreconciled amounts', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('$3,280.00')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('$1,240.00')).toBeInTheDocument();
    expect(screen.getByText('$560.00')).toBeInTheDocument();
  });

  it('renders formatted difference amounts', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('$39,070.00')).toBeInTheDocument();
    expect(screen.getByText('$7,510.00')).toBeInTheDocument();
    expect(screen.getByText('$2,640.00')).toBeInTheDocument();
  });

  it('renders total row', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders correct total reconciled amount', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    // Total reconciled = 42350 + 18500 + 8750 + 3200 = 72800
    expect(screen.getByText('$72,800.00')).toBeInTheDocument();
  });

  it('renders correct total unreconciled amount', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    // Total unreconciled = 3280 + 0 + 1240 + 560 = 5080
    expect(screen.getByText('$5,080.00')).toBeInTheDocument();
  });

  it('renders correct total difference amount', () => {
    render(<BankReconciliationReportPage />, { wrapper: createWrapper() });
    // Total difference = 39070 + 18500 + 7510 + 2640 = 67720
    expect(screen.getByText('$67,720.00')).toBeInTheDocument();
  });
});
