// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PayrollReportPage } from '../routes/PayrollReportPage';

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

describe('PayrollReportPage', () => {
  it('renders the page title', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Payroll Summary');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders breadcrumb with Reports link', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders subtitle describing the report content', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Gross pay, PAYE, and KiwiSaver by period')).toBeInTheDocument();
  });

  it('renders all three period sections', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Jan 2026')).toBeInTheDocument();
    expect(screen.getByText('Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('Mar 2026')).toBeInTheDocument();
  });

  it('renders column headers in each period table', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    const employeeHeaders = screen.getAllByText('Employee');
    expect(employeeHeaders.length).toBe(3);
    const grossPayHeaders = screen.getAllByText('Gross Pay');
    expect(grossPayHeaders.length).toBe(3);
    const payeHeaders = screen.getAllByText('PAYE');
    expect(payeHeaders.length).toBe(3);
    const kiwiSaverHeaders = screen.getAllByText('KiwiSaver');
    expect(kiwiSaverHeaders.length).toBe(3);
    const netPayHeaders = screen.getAllByText('Net Pay');
    expect(netPayHeaders.length).toBe(3);
  });

  it('renders employee names across all periods', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    const johns = screen.getAllByText('John Smith');
    expect(johns.length).toBe(3);
    const sarahs = screen.getAllByText('Sarah Johnson');
    expect(sarahs.length).toBe(3);
    const mikes = screen.getAllByText('Mike Williams');
    expect(mikes.length).toBe(3);
  });

  it('renders total rows for each period', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    const totals = screen.getAllByText('Total');
    expect(totals.length).toBe(3);
  });

  it('renders formatted currency for employee pay values', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText('$5,200.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$6,500.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$3,696.00').length).toBeGreaterThan(0);
  });

  it('renders total gross pay for January period', () => {
    render(<PayrollReportPage />, { wrapper: createWrapper() });
    // Jan total gross = 5200 + 6500 + 4800 = 16500
    expect(screen.getAllByText('$16,500.00').length).toBeGreaterThan(0);
  });
});
