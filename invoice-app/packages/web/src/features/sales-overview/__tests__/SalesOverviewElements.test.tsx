// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Recharts ResponsiveContainer uses ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../hooks/useSales', () => ({
  useSalesSummary: () => ({
    data: {
      totalSalesYTD: 142580.50,
      outstandingInvoices: 23450.00,
      overdueAmount: 5670.25,
      averageDaysToPay: 18,
      invoiceCount: 42,
      paidCount: 28,
      overdueCount: 3,
    },
    isLoading: false,
  }),
  useSalesChart: () => ({
    data: [{ month: 'Jan', amount: 12500 }],
    isLoading: false,
  }),
  useRecentInvoices: () => ({
    data: [
      { id: 'inv-001', reference: 'INV-0042', customer: 'Ridgeway', amount: 6250, date: '2026-02-10', status: 'sent' as const },
    ],
    isLoading: false,
  }),
}));

import { SalesOverviewPage } from '../routes/SalesOverviewPage';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('SalesOverviewPage — New Elements', () => {
  it('renders Invoices / Quotes tabs', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('sales-overview-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('tab-invoices')).toBeInTheDocument();
    expect(screen.getByTestId('tab-quotes')).toBeInTheDocument();
  });

  it('renders status badges section', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('status-badges')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-draft')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-awaiting-approval')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-awaiting-payment')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-overdue')).toBeInTheDocument();
  });

  it('renders Send Statements toolbar button', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('send-statements-button')).toBeInTheDocument();
  });

  it('renders Import toolbar button', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('import-button')).toBeInTheDocument();
  });

  it('renders Search input', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('sales-overview-search')).toBeInTheDocument();
  });

  it('renders New button', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('new-invoice-button')).toBeInTheDocument();
  });

  it('renders Customers Owing the Most table', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('customers-owing')).toBeInTheDocument();
    expect(screen.getByText('Customers Owing the Most')).toBeInTheDocument();
    expect(screen.getByTestId('owing-table')).toBeInTheDocument();
    expect(screen.getByText('Ridgeway University')).toBeInTheDocument();
    expect(screen.getByText('City Agency')).toBeInTheDocument();
  });

  it('renders List/Pie toggle for customers owing', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('owing-view-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('owing-list-view')).toBeInTheDocument();
    expect(screen.getByTestId('owing-pie-view')).toBeInTheDocument();
  });

  it('switches to pie chart view when Pie toggle clicked', () => {
    render(<SalesOverviewPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByTestId('owing-pie-view'));
    expect(screen.getByTestId('owing-pie-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('owing-table')).not.toBeInTheDocument();
  });
});
