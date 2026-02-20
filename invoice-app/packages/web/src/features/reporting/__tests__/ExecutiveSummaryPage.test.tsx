// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExecutiveSummaryPage } from '../routes/ExecutiveSummaryPage';

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

describe('ExecutiveSummaryPage', () => {
  it('renders the page title', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    const titles = screen.getAllByText('Executive Summary');
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders breadcrumb with Reports link', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders subtitle with year-end date', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/For the year ended/)).toBeInTheDocument();
  });

  it('renders Profit and Loss Summary section', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('pnl-summary')).toBeInTheDocument();
    expect(screen.getByText('Profit & Loss Summary')).toBeInTheDocument();
  });

  it('renders P&L line items with correct labels', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Cost of Sales')).toBeInTheDocument();
    expect(screen.getByText('Gross Profit')).toBeInTheDocument();
    expect(screen.getByText('Operating Expenses')).toBeInTheDocument();
    expect(screen.getByText('Net Profit')).toBeInTheDocument();
  });

  it('renders P&L values as formatted currency', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('$247,500.00')).toBeInTheDocument();
    expect(screen.getByText('$82,500.00')).toBeInTheDocument();
    expect(screen.getByText('$165,000.00')).toBeInTheDocument();
    expect(screen.getByText('$80,700.00')).toBeInTheDocument();
    expect(screen.getByText('$84,300.00')).toBeInTheDocument();
  });

  it('renders Balance Sheet Summary section', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('bs-summary')).toBeInTheDocument();
    expect(screen.getByText('Balance Sheet Summary')).toBeInTheDocument();
  });

  it('renders balance sheet line items', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Current Assets')).toBeInTheDocument();
    expect(screen.getByText('Fixed Assets')).toBeInTheDocument();
    expect(screen.getByText('Total Assets')).toBeInTheDocument();
    expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
    expect(screen.getByText('Total Equity')).toBeInTheDocument();
  });

  it('renders balance sheet values', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('$91,590.00')).toBeInTheDocument();
    expect(screen.getByText('$45,000.00')).toBeInTheDocument();
    expect(screen.getByText('$136,590.00')).toBeInTheDocument();
    expect(screen.getByText('$21,400.00')).toBeInTheDocument();
    expect(screen.getByText('$115,190.00')).toBeInTheDocument();
  });

  it('renders Cash Position section', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('cash-summary')).toBeInTheDocument();
    expect(screen.getByText('Cash Position')).toBeInTheDocument();
  });

  it('renders cash position line items', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('Opening Balance')).toBeInTheDocument();
    expect(screen.getByText('Net Change')).toBeInTheDocument();
    expect(screen.getByText('Closing Balance')).toBeInTheDocument();
  });

  it('renders cash position values', () => {
    render(<ExecutiveSummaryPage />, { wrapper: createWrapper() });
    expect(screen.getByText('$48,200.00')).toBeInTheDocument();
    expect(screen.getByText('$4,640.00')).toBeInTheDocument();
    expect(screen.getByText('$52,840.00')).toBeInTheDocument();
  });
});
